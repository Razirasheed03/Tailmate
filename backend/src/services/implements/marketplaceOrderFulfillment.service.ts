import mongoose, { Types } from "mongoose";
import Stripe from "stripe";
import { stripe } from "../../utils/stripe";
import { MarketOrder } from "../../schema/marketOrder.schema";
import { MarketplaceListing } from "../../schema/marketplaceListing.schema";
import { Pet } from "../../schema/pet.schema";
import { Wallet } from "../../schema/wallet.schema";

const PLATFORM_FEE_RATE = 0.2;

export function splitMarketplaceAmount(amountMajor: number) {
  const platformFeeMajor = Math.round(amountMajor * PLATFORM_FEE_RATE);
  const sellerEarningMajor = amountMajor - platformFeeMajor;
  return { platformFeeMajor, sellerEarningMajor };
}

type FulfillResult = "fulfilled" | "already_paid" | "not_ready" | "not_found";

function log(tag: string, ...args: unknown[]) {
  console.log(`[MarketplaceFulfill][${tag}]`, ...args);
}

async function resolveChargeId(paymentIntentId: string): Promise<string | null> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return typeof paymentIntent.latest_charge === "string"
      ? paymentIntent.latest_charge
      : (paymentIntent.latest_charge as Stripe.Charge | null)?.id || null;
  } catch (err: any) {
    log("ERROR", "Failed to retrieve PaymentIntent:", err?.message);
    return null;
  }
}

/**
 * Idempotent fulfillment: marks order paid, credits seller + admin wallets,
 * transfers pet ownership, closes listing.
 */
export async function fulfillPaidMarketplaceOrder(
  orderId: string,
  paymentIntentId: string,
  chargeId: string | null
): Promise<FulfillResult> {
  if (!Types.ObjectId.isValid(orderId)) return "not_found";

  const dbSession = await mongoose.startSession();
  try {
    let outcome: FulfillResult = "not_ready";

    await dbSession.withTransaction(async () => {
      const order = await MarketOrder.findById(orderId).session(dbSession);
      if (!order) {
        outcome = "not_found";
        return;
      }

      if (order.status === "paid" && order.walletCredited) {
        outcome = "already_paid";
        return;
      }

      if (order.status !== "created" && order.status !== "paid") {
        outcome = "not_ready";
        return;
      }

      const amountMajor = Number(order.amount || 0);
      const { platformFeeMajor, sellerEarningMajor } = splitMarketplaceAmount(amountMajor);
      const currencyCode = (order.currency || "INR").toUpperCase();
      const sellerEarnMinor = Math.round(sellerEarningMajor * 100);
      const platformFeeMinor = Math.round(platformFeeMajor * 100);

      const walletGate = await MarketOrder.updateOne(
        {
          _id: order._id,
          walletCredited: { $ne: true },
          status: { $in: ["created", "paid"] },
        },
        {
          $set: {
            status: "paid",
            paymentIntentId,
            chargeId: chargeId ?? "",
            platformFee: platformFeeMajor,
            sellerEarning: sellerEarningMajor,
            walletCredited: true,
            walletCreditedAt: new Date(),
          },
        },
        { session: dbSession }
      );

      if (walletGate.modifiedCount !== 1) {
        const fresh = await MarketOrder.findById(orderId).session(dbSession).lean();
        outcome =
          fresh?.status === "paid" && fresh?.walletCredited ? "already_paid" : "not_ready";
        return;
      }

      if (sellerEarnMinor > 0) {
        await Wallet.updateOne(
          {
            ownerType: "user",
            ownerId: order.sellerId,
            currency: currencyCode,
          },
          { $inc: { balanceMinor: sellerEarnMinor } },
          { upsert: true, session: dbSession }
        );
      }

      if (platformFeeMinor > 0) {
        await Wallet.updateOne(
          { ownerType: "admin", currency: currencyCode },
          { $inc: { balanceMinor: platformFeeMinor } },
          { upsert: true, session: dbSession }
        );
      }

      if (order.petId) {
        await Pet.findByIdAndUpdate(
          order.petId,
          {
            currentOwnerId: order.buyerId,
            $push: {
              history: {
                at: new Date(),
                action: "ownership_transferred",
                by: order.buyerId,
                meta: { from: order.sellerId, orderId: order._id },
              },
            },
            status: "active",
          },
          { session: dbSession }
        );
      }

      await MarketplaceListing.findByIdAndUpdate(
        order.listingId,
        {
          status: "closed",
          $push: {
            history: {
              at: new Date(),
              action: "status_changed",
              by: order.buyerId,
              meta: { status: "closed", reason: "payment_succeeded" },
            },
          },
        },
        { session: dbSession }
      );

      log("OK", "Order fulfilled:", orderId, {
        sellerEarnMinor,
        platformFeeMinor,
        sellerId: order.sellerId,
      });
      outcome = "fulfilled";
    });

    return outcome;
  } finally {
    dbSession.endSession();
  }
}

/**
 * Confirms payment with Stripe then fulfills. Safe to call from polling (idempotent).
 */
export async function tryFulfillMarketplaceOrderFromStripe(
  orderId: string,
  opts?: { sessionId?: string }
): Promise<FulfillResult> {
  const order = await MarketOrder.findById(orderId).lean();
  if (!order) return "not_found";
  if (order.status === "paid" && order.walletCredited) return "already_paid";

  const sessionId = opts?.sessionId || order.stripeSessionId;
  if (!sessionId) return "not_ready";

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err: any) {
    log("ERROR", "Could not retrieve checkout session:", sessionId, err?.message);
    return "not_ready";
  }

  if (session.payment_status !== "paid") return "not_ready";

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent as Stripe.PaymentIntent | null)?.id || "";

  if (!paymentIntentId) return "not_ready";

  const chargeId = await resolveChargeId(paymentIntentId);
  return fulfillPaidMarketplaceOrder(orderId, paymentIntentId, chargeId);
}
