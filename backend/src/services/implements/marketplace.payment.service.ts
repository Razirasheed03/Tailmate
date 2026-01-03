// backend/src/services/implements/marketplace.payment.service.ts
import { Types } from "mongoose";
import { stripe } from "../../utils/stripe";
import { MarketOrder } from "../../schema/marketOrder.schema";
import { MarketplaceListing } from "../../schema/marketplaceListing.schema";
import { IMarketplacePaymentService, CreateSessionPayload, CreateSessionResp } from "../interfaces/marketplace.payment.service.interface";
import { getFrontendUrl } from "../../config/url.config";

export class MarketplacePaymentService implements IMarketplacePaymentService {
  async createCheckoutSession(payload: CreateSessionPayload, buyerId: string): Promise<CreateSessionResp> {
    const { listingId } = payload || ({} as CreateSessionPayload);
    if (!listingId || !Types.ObjectId.isValid(listingId)) throw new Error("Invalid listing");

    const listing = await MarketplaceListing.findById(listingId).lean();
    if (!listing || listing.status !== "active") throw new Error("Listing unavailable");
    if (listing.type !== "sell") throw new Error("Listing is not for sale");
    if (!listing.petId) throw new Error("Listing missing petId");
    const amount = Number(listing.price || 0);
    if (amount <= 0) throw new Error("Invalid amount");

    const sellerId = String(listing.sellerId || listing.userId);

    // Create order
    const order = await MarketOrder.create({
      listingId: listing._id,
      petId: listing.petId,
      buyerId: new Types.ObjectId(buyerId),
      sellerId: new Types.ObjectId(sellerId),
      amount,
      currency: "INR",
      status: "created",
    });
const frontendUrl = getFrontendUrl();
    // Stripe Checkout Session (collect to platform)
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "inr",
              product_data: { name: listing.title },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        success_url: `${frontendUrl}/payments/Success?session_id={CHECKOUT_SESSION_ID}&orderId=${order._id}`,
        cancel_url: `${frontendUrl}/payments/cancel?orderId=${order._id}`,
        metadata: {
          kind: "marketplace",
          orderId: String(order._id),
          listingId: String(listing._id),
          petId: String(listing.petId),
          buyerId: String(buyerId),
          sellerId: String(sellerId),
        },
      },
      { idempotencyKey: `mp-chk:${order._id}:${buyerId}` }
    );

    await MarketOrder.findByIdAndUpdate(order._id, { stripeSessionId: session.id });

    return { url: session.url ?? null, orderId: String(order._id) };
  }
}
