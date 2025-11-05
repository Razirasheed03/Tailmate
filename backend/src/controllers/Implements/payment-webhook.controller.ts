import { Request, Response } from "express";
import Stripe from "stripe";
import { stripe } from "../../utils/stripe";
import { PaymentModel } from "../../models/implements/payment.model";
import { Booking, BookingLean } from "../../schema/booking.schema";
import { MarketOrder } from "../../schema/marketOrder.schema";
import { MarketplaceListing } from "../../schema/marketplaceListing.schema";
import { Pet } from "../../schema/pet.schema";
import { Wallet } from "../../schema/wallet.schema";
import { Types } from "mongoose";
import { io } from "../../server"; // make sure server exports io!

export async function paymentsWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  console.log("=== Stripe webhook triggered ===");

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
    console.log("Stripe event type:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const kind = session.metadata?.kind || "doctor";
      console.log(`Webhook session id: ${session.id}, kind: ${kind}, metadata:`, session.metadata);

      if (kind === "doctor") {
        const paymentId = session.metadata?.paymentDbId as string | undefined;
        const bookingId = session.metadata?.bookingId as string | undefined;

        if (!paymentId) {
          console.warn("No paymentDbId metadata on doctor checkout session, skipping processing");
          return res.status(200).send("ok");
        }

        const paymentIntentId = typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent as Stripe.PaymentIntent | null)?.id || "";
        console.log(`Doctor booking paymentIntentId: ${paymentIntentId}`);

        await PaymentModel.findByIdAndUpdate(paymentId, {
          paymentStatus: "success",
          paymentIntentId,
        }, { new: true }).lean();

        if (bookingId && Types.ObjectId.isValid(bookingId)) {
          await Booking.updateOne({ _id: new Types.ObjectId(bookingId) }, {
            status: "paid",
            paidAt: new Date(),
            paymentIntentId,
            paymentSessionId: session.id,
          });
          console.log(`Booking marked paid: ${bookingId}`);

          // --- Doctor Notification, slot info & bookings link ---
          const paidBooking = await Booking.findOne({ _id: bookingId, status: "paid" }).lean() as BookingLean | null;
          if (paidBooking) {
            // Create a nice message, e.g.: 'Tuesday 2:00 pm slot booked!'
            const slotDate = new Date(`${paidBooking.date}T${paidBooking.time}:00`); // ISO format
            const dateMsg = slotDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "short",
              day: "numeric"
            });
            const timeMsg = paidBooking.time;

            io.to(`doctor_${paidBooking.doctorId}`).emit("doctor_notification", {
              message: `${dateMsg} ${timeMsg} slot booked!`,
              patientName: paidBooking.petName,
              // Complete info sent for frontend
              date: paidBooking.date,
              time: paidBooking.time,
              bookingId: String(paidBooking._id),
              createdAt: paidBooking.createdAt,
              // Bookings redirect link (add this for click-on-notification):
              bookingsUrl: "/doctor/appointments", // Or your actual route
            });
            console.log(`Notification emitted to doctor_${paidBooking.doctorId}`);
          }
        }

        return res.status(200).send("ok");
      }

      // ---- marketplace payment ----
      if (kind === "marketplace") {
        const orderId = session.metadata?.orderId;
        console.log(`Marketplace orderId: ${orderId}`);

        if (!orderId || !Types.ObjectId.isValid(orderId)) {
          console.warn("Invalid or missing orderId, skipping marketplace processing");
          return res.status(200).send("ok");
        }

        const order = await MarketOrder.findById(orderId);
        if (!order) {
          console.warn("Marketplace order not found, skipping");
          return res.status(200).send("ok");
        }
        if (order.status !== "created") {
          console.log(`Order with id ${orderId} already processed with status ${order.status}`);
          return res.status(200).send("ok");
        }

        const paymentIntentId = typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent as Stripe.PaymentIntent | null)?.id || "";
        console.log(`PaymentIntent to retrieve: ${paymentIntentId}`);

        if (!paymentIntentId) {
          console.error("No PaymentIntent on checkout.session, aborting webhook");
          return res.status(200).send("ok");
        }

        let chargeId: string | null = null;

        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          chargeId = typeof paymentIntent.latest_charge === "string"
            ? paymentIntent.latest_charge
            : (paymentIntent.latest_charge as Stripe.Charge | null)?.id || null;

          console.log(`Retrieved PaymentIntent ${paymentIntentId} with charge ${chargeId}`);
        } catch (error: any) {
          console.error("Failed to retrieve PaymentIntent:", error.message);
          order.status = "failed";
          await order.save();
          return res.status(500).send("PaymentIntent retrieval failed");
        }

        order.paymentIntentId = paymentIntentId;
        order.chargeId = chargeId ?? "";
        order.status = "paid";
        await order.save();
        console.log(`Updated MarketOrder ${orderId} to paid`);

        // Credit seller's wallet
        await Wallet.updateOne(
          { ownerType: "user", ownerId: order.sellerId, currency: (order.currency || "INR").toUpperCase() },
          { $inc: { balanceMinor: Math.round(order.amount * 100) } },
          { upsert: true }
        );
        console.log("Seller wallet credited");

        // Update pet ownership and history
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
          console.log(`Pet ownership transferred to buyer: ${order.buyerId}`);
        }

        // Close marketplace listing and add history entry
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
        console.log("Marketplace listing closed");

        return res.status(200).send("ok");
      }
    }

    // If event type not handled
    return res.status(200).send("ok");
  } catch (error: any) {
    console.error("Stripe webhook error:", error?.message);
    return res.status(400).send("Webhook error");
  }
}
