// services/implements/payment.service.ts
import { Request } from "express";
import Stripe from "stripe";
import { stripe } from "../../utils/stripe";
import { PaymentRepository } from "../../repositories/implements/payment.repository";
import { Booking } from "../../schema/booking.schema";

export type CreateCheckoutSessionResponse = { url: string | null }; // session.url may be null in some cases [Stripe]
export type WebhookProcessResult =
  | { handled: true; type: "checkout.session.completed"; paymentId?: string }
  | { handled: false; type: string }

export class PaymentService {
  constructor(private repo = new PaymentRepository()) {}

  async createCheckoutSession(
    payload: { bookingId: string },
    userId: string
  ): Promise<CreateCheckoutSessionResponse> {
    const booking = await Booking.findById(payload.bookingId).lean();
    if (!booking) throw new Error("Booking not found");
    if (String(booking.patientId) !== String(userId)) throw new Error("Forbidden");

    const amount = Number(booking.amount || 0);
    const platformFee = Math.round(amount * 0.20);
    const doctorEarning = amount - platformFee;
    const currency = booking.currency || "INR";

    const payment = await this.repo.create({
      patientId: booking.patientId,
      doctorId: booking.doctorId,
      bookingId: booking._id,
      amount,
      platformFee,
      doctorEarning,
      currency,
      paymentStatus: "pending",
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: "Doctor consultation",
              metadata: { bookingId: String(booking._id) },
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_URL}/payments/Success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/payments/cancel`,
      metadata: {
        paymentDbId: String(payment._id),
        bookingId: String(booking._id),
        doctorId: String(booking.doctorId),
        patientId: String(booking.patientId),
      },
    });

    return { url: session.url ?? null };
  }

  async processWebhook(req: Request): Promise<WebhookProcessResult> {
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (e: any) {
      console.error("Stripe webhook signature error:", e?.message);
      throw new Error("Invalid signature");
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.paymentDbId as string | undefined;
      if (paymentId) {
        const paymentIntentId = String(session.payment_intent || "");
        await this.repo.update(paymentId, {
          paymentStatus: "success",
          paymentIntentId,
          receiptUrl: session.url || "",
        });
      }
      return { handled: true, type: "checkout.session.completed", paymentId };
    }


    return { handled: false, type: event.type };
  }

  async doctorPayments(doctorId: string): Promise<any> {
    return await this.repo.byDoctor(doctorId);
  }
}
