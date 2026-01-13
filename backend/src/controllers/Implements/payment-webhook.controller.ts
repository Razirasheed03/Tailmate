import { Request, Response } from "express";
import Stripe from "stripe";
import { stripe } from "../../utils/stripe";
import { PaymentModel } from "../../models/implements/payment.model";
import { Booking, BookingLean } from "../../schema/booking.schema";
import { MarketOrder } from "../../schema/marketOrder.schema";
import { MarketplaceListing } from "../../schema/marketplaceListing.schema";
import { Pet } from "../../schema/pet.schema";
import { Wallet } from "../../schema/wallet.schema";
import mongoose, { Types } from "mongoose";
import { io } from "../../server"; // ensure server exports io!
import { NotificationModel } from "../../schema/notification.schema";

// Helper log function for clarity in logs
function logWithTag(tag: string, ...args: any[]) {
  console.log(`[StripeWebhook][${tag}]`, ...args);
}

export async function paymentsWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  logWithTag("INIT", "Webhook triggered, signature present:", !!sig);

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
    logWithTag("EVENT", "Type:", event.type);

    // --------- Doctor Booking Flow ---------
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const kind = session.metadata?.kind || "doctor";
      logWithTag("SESSION", "session id:", session.id, "kind:", kind, "metadata:", session.metadata);

      if (kind === "doctor") {
        const paymentId = session.metadata?.paymentDbId as string | undefined;
        const bookingId = session.metadata?.bookingId as string | undefined;
        const doctorId = session.metadata?.doctorId as string | undefined;

        const paymentIntentId = typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent as Stripe.PaymentIntent | null)?.id || "";

        // Ensure payment record exists and is updated (supports older sessions without paymentDbId)
        let updatedPayment: any = null;
        if (paymentId && Types.ObjectId.isValid(paymentId)) {
          logWithTag("PAYMENT", "Updating PaymentModel by paymentDbId:", paymentId, "paymentIntentId:", paymentIntentId);
          updatedPayment = await PaymentModel.findOneAndUpdate(
            { _id: new Types.ObjectId(paymentId), paymentStatus: { $ne: "refunded" } },
            { $set: { paymentStatus: "success", paymentIntentId } },
            { new: true }
          ).lean();
        }

        if (!updatedPayment && bookingId && Types.ObjectId.isValid(bookingId)) {
          logWithTag("PAYMENT", "Updating PaymentModel by bookingId:", bookingId, "paymentIntentId:", paymentIntentId);
          updatedPayment = await PaymentModel.findOneAndUpdate(
            { bookingId: new Types.ObjectId(bookingId), paymentStatus: { $ne: "refunded" } },
            { $set: { paymentStatus: "success", paymentIntentId } },
            { new: true, sort: { createdAt: -1 } }
          ).lean();
        }

        if (!updatedPayment && bookingId && Types.ObjectId.isValid(bookingId)) {
          const bookingForPayment = await Booking.findById(bookingId).lean() as any;
          if (bookingForPayment) {
            const amountMajor = Number(bookingForPayment.amount || 0);
            const platformFeeMajor = Math.round(amountMajor * 0.2);
            const doctorEarningMajor = amountMajor - platformFeeMajor;
            logWithTag("PAYMENT", "Creating missing PaymentModel for bookingId:", bookingId);
            await PaymentModel.create({
              patientId: bookingForPayment.patientId,
              doctorId: bookingForPayment.doctorId,
              bookingId: bookingForPayment._id,
              amount: amountMajor,
              platformFee: platformFeeMajor,
              doctorEarning: doctorEarningMajor,
              currency: bookingForPayment.currency || "INR",
              paymentStatus: "success",
              paymentIntentId,
            });
          }
        }

        if (!bookingId) {
          logWithTag("ERROR", "No bookingId present in metadata for doctor checkout.");
          return res.status(200).send("ok");
        }
        if (!Types.ObjectId.isValid(bookingId)) {
          logWithTag("ERROR", "bookingId is not valid ObjectId:", bookingId);
          return res.status(200).send("ok");
        }

        const dbSession = await mongoose.startSession();
        try {
          await dbSession.withTransaction(async () => {
            logWithTag("BOOKING", "Marking booking as paid:", bookingId);
            const bookingPaidUpdate = await Booking.updateOne(
              { _id: new Types.ObjectId(bookingId), status: { $in: ["pending", "failed"] } },
              {
                status: "paid",
                paidAt: new Date(),
                paymentIntentId,
                paymentSessionId: session.id,
              },
              { session: dbSession }
            );

            // Wallet funding is required so later cancellations can debit doctor/admin without going negative.
            // Make it crash-safe + idempotent by gating via Payment.walletCredited inside the same DB transaction.
            if (bookingPaidUpdate.modifiedCount === 1) {
              const paymentRow = await PaymentModel.findOne({
                bookingId: new Types.ObjectId(bookingId),
                paymentStatus: "success",
              })
                .sort({ createdAt: -1 })
                .session(dbSession)
                .lean();

              if (!paymentRow) {
                logWithTag("WALLET", "No success PaymentModel found to credit wallets. bookingId:", bookingId);
                return;
              }

              const walletCreditGate = await PaymentModel.updateOne(
                { _id: paymentRow._id, walletCredited: { $ne: true }, paymentStatus: "success" },
                { $set: { walletCredited: true, walletCreditedAt: new Date() } },
                { session: dbSession }
              );

              if (walletCreditGate.modifiedCount !== 1) {
                return;
              }

              const currencyCode = (paymentRow.currency || "INR").toUpperCase();
              const doctorEarnMinor = Math.round(Number(paymentRow.doctorEarning || 0) * 100);
              const platformFeeMinor = Math.round(Number(paymentRow.platformFee || 0) * 100);

              if (doctorEarnMinor > 0) {
                await Wallet.updateOne(
                  { ownerType: "doctor", ownerId: paymentRow.doctorId, currency: currencyCode },
                  { $inc: { balanceMinor: doctorEarnMinor } },
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

              logWithTag("WALLET", "Credited doctor/admin wallets for bookingId:", bookingId);
            }
          });
        } finally {
          dbSession.endSession();
        }

        const paidBooking = await Booking.findOne(
          { _id: bookingId, status: "paid" }
        ).lean() as BookingLean | null;

        if (!paidBooking) {
          logWithTag("ERROR", "Booking marked as paid not found in DB!", bookingId);
          return res.status(200).send("ok");
        }
        if (!doctorId) {
          logWithTag("ERROR", "No doctorId in metadata for room join/emit.");
          return res.status(200).send("ok");
        }

        // Log current IO rooms for diagnosis
        const allRooms = Object.keys(io.sockets.adapter.rooms);
        logWithTag("SOCKET.IO", "Current rooms:", allRooms);

        // Format a friendly slot message
        const slotDate = new Date(`${paidBooking.date}T${paidBooking.time}:00`);
        const dateMsg = slotDate.toLocaleDateString("en-US", {
          weekday: "long", year: "numeric", month: "short", day: "numeric"
        });
        const timeMsg = paidBooking.time;
        const notificationMsg = `${dateMsg} ${timeMsg} slot booked!`;

        // Emit to doctor user room (sockets join user:${userId})
        const roomName = `user:${doctorId}`;
        logWithTag("NOTIFY", `Emitting notification to room: ${roomName}`);
        io.to(roomName).emit("doctor_notification", {
          message: notificationMsg,
          patientName: paidBooking.petName,
          date: paidBooking.date,
          time: paidBooking.time,
          bookingId: String(paidBooking._id),
          createdAt: paidBooking.createdAt,
          bookingsUrl: "/doctor/appointments",
        });

        // Idempotent notification (prevents duplicates on webhook retries); only emit when inserted
        const notifFilter = {
          userId: new Types.ObjectId(doctorId),
          userRole: "doctor",
          type: "booking",
          "meta.bookingId": String(paidBooking._id),
        };

        const notifUpsert = await NotificationModel.updateOne(
          notifFilter,
          {
            $setOnInsert: {
              message: notificationMsg,
              meta: {
                patientName: paidBooking.petName,
                date: paidBooking.date,
                time: paidBooking.time,
                bookingId: String(paidBooking._id),
              },
              read: false,
            },
          },
          { upsert: true, setDefaultsOnInsert: true }
        );

        if (notifUpsert.upsertedCount === 1) {
          const notifDoc = await NotificationModel.findOne(notifFilter).lean();
          if (notifDoc?._id) {
            io.to(roomName).emit("notification:new", {
              _id: notifDoc._id,
              message: notifDoc.message,
              createdAt: notifDoc.createdAt,
              read: notifDoc.read,
              type: notifDoc.type,
              meta: notifDoc.meta,
            });
          }
        }

        logWithTag("NOTIFY", `Notification emitted for doctorId: ${doctorId}, bookingId: ${bookingId}`);
      }

      // --------- Marketplace Order Flow ---------
      if (kind === "marketplace") {
        const orderId = session.metadata?.orderId;
        if (!orderId || !Types.ObjectId.isValid(orderId)) {
          logWithTag("ERROR", "Invalid or missing orderId in metadata:", { orderId, metadata: session.metadata });
          return res.status(200).send("ok");
        }
        const order = await MarketOrder.findById(orderId);
        if (!order) {
          logWithTag("ERROR", "Marketplace order not found for id:", orderId);
          return res.status(200).send("ok");
        }
        if (order.status !== "created") {
          logWithTag("SKIP", `Order ${orderId} already processed with status: ${order.status}`);
          return res.status(200).send("ok");
        }
        const paymentIntentId = typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent as Stripe.PaymentIntent | null)?.id || "";
        if (!paymentIntentId) {
          logWithTag("ERROR", "No paymentIntentId on session:", session);
          return res.status(200).send("ok");
        }
        let chargeId: string | null = null;
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          chargeId = typeof paymentIntent.latest_charge === "string"
            ? paymentIntent.latest_charge
            : (paymentIntent.latest_charge as Stripe.Charge | null)?.id || null;
          logWithTag("CHARGE", `Retrieved charge on PaymentIntent ${paymentIntentId}:`, chargeId);
        } catch (error: any) {
          logWithTag("ERROR", "Failed to retrieve PaymentIntent:", error.message);
          order.status = "failed";
          await order.save();
          return res.status(500).send("PaymentIntent retrieval failed");
        }
        order.paymentIntentId = paymentIntentId;
        order.chargeId = chargeId ?? "";
        order.status = "paid";
        await order.save();
        logWithTag("ORDER", `Order ${orderId} status updated to paid`);

        // Credit seller's wallet
        await Wallet.updateOne(
          { ownerType: "user", ownerId: order.sellerId, currency: (order.currency || "INR").toUpperCase() },
          { $inc: { balanceMinor: Math.round(order.amount * 100) } },
          { upsert: true }
        );
        logWithTag("WALLET", "Seller wallet credited for id:", order.sellerId);

        // Pet transfer logic...
        if (order.petId) {
          await Pet.findByIdAndUpdate(order.petId, {
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
          });
          logWithTag("PET", "Pet ownership transferred to buyer:", order.buyerId);
        }

        await MarketplaceListing.findByIdAndUpdate(order.listingId, {
          status: "closed",
          $push: {
            history: {
              at: new Date(),
              action: "status_changed",
              by: order.buyerId,
              meta: { status: "closed", reason: "payment_succeeded" },
            },
          },
        });
        logWithTag("LISTING", "Marketplace listing closed:", order.listingId);
      }

      // -- Add similar blocks for other "kind" if needed --
    }

    // --- Other Stripe event types --
    logWithTag("SKIP", "Event type not handled. Returning 200.");
    return res.status(200).send("ok");
  } catch (error: any) {
    logWithTag("FATAL", "Stripe webhook error:", error?.message);
    return res.status(400).send("Webhook error");
  }
}
