// services/implements/payment.service.ts

import { Request } from "express";
import Stripe from "stripe";
import { stripe } from "../../utils/stripe";
import { IPaymentRepository } from "../../repositories/interfaces/payment.repository.interface";
import { Booking } from "../../schema/booking.schema";
import {
  IPaymentService,
  CreateCheckoutSessionResponse,
  WebhookProcessResult,
  PaginationQuery,
} from "../interfaces/payment.service.interface";
import { PaginatedResult } from "../../repositories/interfaces/payment.repository.interface";
import { IPayment } from "../../models/implements/payment.model";

export class PaymentService implements IPaymentService {
  constructor(private repo: IPaymentRepository) {}

  async createCheckoutSession(
    payload: { bookingId: string },
    userId: string
  ): Promise<CreateCheckoutSessionResponse> {
    const booking = await Booking.findById(payload.bookingId).lean();
    if (!booking) throw new Error("Booking not found");

    if (String(booking.patientId) !== String(userId)) {
      throw new Error("Forbidden");
    }

    const amount = Number(booking.amount || 0);
    const platformFee = Math.round(amount * 0.2);
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
              name: "Doctor Consultation",
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],

      // ✅ MUST be HTTPS frontend (Vercel)
      success_url: `${process.env.FRONTEND_URL}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payments/cancel`,

      metadata: {
        kind: "doctor",
        paymentDbId: String(payment._id),
        bookingId: String(booking._id),
        doctorId: String(booking.doctorId),
        patientId: String(booking.patientId),
      },
    });

    return { url: session.url ?? null };
  }

  /**
   * Minimal webhook handler
   * (Controller already handles full business logic)
   */
  async processWebhook(req: Request): Promise<WebhookProcessResult> {
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err: any) {
      throw new Error("Invalid Stripe signature");
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.paymentDbId;

      if (paymentId) {
        await this.repo.update(paymentId, {
          paymentStatus: "success",
          paymentIntentId: String(session.payment_intent || ""),
        });
      }

      return {
        handled: true,
        type: "checkout.session.completed",
        paymentId,
      };
    }

    return { handled: false, type: event.type };
  }

  async doctorPayments(
    doctorId: string,
    query: PaginationQuery = {}
  ): Promise<PaginatedResult<IPayment>> {
    return this.repo.byDoctorPaginated(doctorId, query);
  }
}
