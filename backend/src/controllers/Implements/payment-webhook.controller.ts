// backend/src/controllers/payment.webhook.controller.ts
import { Request, Response } from "express";
import Stripe from "stripe";
import { stripe } from "../../utils/stripe";
import { PaymentModel } from "../../models/implements/payment.model";
import { Booking } from "../../schema/booking.schema";
import { Types } from "mongoose";

export async function paymentsWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;

  try {
    // Verify the Stripe webhook signature
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
    console.log("Stripe event:", event.type);

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("Webhook metadata:", session.metadata);

      // Extract payment and booking IDs from metadata
      const paymentId = session.metadata?.paymentDbId as string | undefined;
      const bookingId = session.metadata?.bookingId as string | undefined;

      if (!paymentId) {
        console.warn("No paymentDbId in session.metadata; cannot update Payment");
        return res.status(200).send("ok");
      }

      // Update Payment status to success
      const paymentIntentId = String(session.payment_intent || "");
      const updatedPayment = await PaymentModel.findByIdAndUpdate(
        paymentId,
        { $set: { paymentStatus: "success", paymentIntentId } },
        { new: true }
      ).lean();

      console.log("Payment updated:", paymentId, "->", updatedPayment?.paymentStatus);

      // ✅ Update related Booking document if available
      if (bookingId && Types.ObjectId.isValid(bookingId)) {
        await Booking.updateOne(
          { _id: new Types.ObjectId(bookingId) },
          {
            $set: {
              status: "paid",
              paidAt: new Date(),
              paymentIntentId: String(session.payment_intent || ""),
              paymentSessionId: session.id,
            },
          }
        );
        console.log("Booking marked paid:", bookingId);
      }
    }

    return res.status(200).send("ok");
  } catch (err: any) {
    console.error("Stripe webhook signature/handler error:", err?.message);
    return res.status(400).send("Webhook error");
  }
}
