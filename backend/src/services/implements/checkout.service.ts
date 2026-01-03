// services/implements/checkout.service.ts

import { Types } from "mongoose";
import { IDoctorPublicRepository } from "../../repositories/interfaces/doctorPublic.repository.interface";
import { generateBookingNumber } from "../../utils/generateBookingNumber";
import { Booking } from "../../schema/booking.schema";
import { stripe } from "../../utils/stripe";
import {
  ICheckoutService,
  QuoteInput,
  QuoteOutput,
  CreateCheckoutInput,
  CreateCheckoutResult,
  UIMode,
} from "../interfaces/checkout.service.interface";
import { getFrontendUrl } from "../../config/url.config";

function toUTCDate(date: string, time: string) {
  const d = new Date(`${date}T00:00:00Z`);
  const [h, m] = time.split(":").map(Number);
  d.setUTCHours(h || 0, m || 0, 0, 0);
  return d;
}

type GeneratedSlot = {
  date: string;
  time: string;
  durationMins: number;
  modes: UIMode[];
  fee?: number;
};

export class CheckoutService implements ICheckoutService {
  constructor(private readonly pub: IDoctorPublicRepository) {}

  private async verifyGeneratedSlot(
    doctorId: string,
    sel: { date: string; time: string; durationMins: number; mode: UIMode },
    opts?: { minLeadMinutes?: number }
  ): Promise<GeneratedSlot | null> {
    if (!Types.ObjectId.isValid(doctorId)) return null;

    if (opts?.minLeadMinutes) {
      const start = toUTCDate(sel.date, sel.time);
      const diffMin = Math.floor((start.getTime() - Date.now()) / 60000);
      if (diffMin < opts.minLeadMinutes) return null;
    }

    const gen = await this.pub.listGeneratedAvailability(doctorId, {
      from: sel.date,
      to: sel.date,
    });

    const match = gen.find(
      (s) =>
        s.date === sel.date &&
        s.time === sel.time &&
        s.durationMins === sel.durationMins &&
        Array.isArray(s.modes) &&
        s.modes.includes(sel.mode)
    );
    if (!match) return null;

    const conflict = await Booking.findOne({
      doctorId: new Types.ObjectId(doctorId),
      date: sel.date,
      time: sel.time,
      status: { $in: ["pending", "paid"] },
    }).lean();

    return conflict ? null : match;
  }

  async getQuote(userId: string, payload: QuoteInput): Promise<QuoteOutput> {
    const { doctorId, date, time, durationMins, mode, baseFee } = payload || ({} as QuoteInput);
    
    if (!doctorId || !date || !time || !durationMins || !mode) {
      throw Object.assign(new Error("Missing required fields"), { status: 400 });
    }

    const match = await this.verifyGeneratedSlot(
      doctorId,
      { date, time, durationMins: Number(durationMins), mode },
      { minLeadMinutes: 30 }
    );
    
    if (!match) {
      throw Object.assign(new Error("Selected slot is not available"), { status: 400 });
    }

    const fee = Number(match.fee ?? baseFee ?? 0);
    const tax = 0;
    const discount = 0;
    const totalAmount = fee;

    return { amount: fee, tax, discount, totalAmount, currency: "INR" };
  }

  async createCheckout(
    userId: string,
    payload: CreateCheckoutInput
  ): Promise<CreateCheckoutResult> {
    const {
      doctorId,
      date,
      time,
      durationMins,
      mode,
      amount,
      currency,
      petName,
      notes,
      paymentMethod,
    } = payload || ({} as CreateCheckoutInput);

    if (
      !doctorId ||
      !date ||
      !time ||
      !durationMins ||
      !mode ||
      amount == null ||
      !currency ||
      !petName ||
      !paymentMethod
    ) {
      throw Object.assign(new Error("Missing required fields"), { status: 400 });
    }

    const match = await this.verifyGeneratedSlot(
      doctorId,
      { date, time, durationMins: Number(durationMins), mode },
      { minLeadMinutes: 30 }
    );
    
    if (!match) {
      throw Object.assign(new Error("Selected slot is not available"), { status: 400 });
    }

    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const today = `${day}${month}${year}`;

    const lastBooking = await Booking.findOne({
      bookingNumber: { $regex: `^BK-${today}-` },
    })
      .sort({ createdAt: -1 })
      .lean();

    let lastSerial = 0;
    if (lastBooking && lastBooking.bookingNumber) {
      const parts = lastBooking.bookingNumber.split("-");
      lastSerial = Number(parts[2]) || 0;
    }

    const fee = Number(match.fee ?? amount ?? 0);
    const bookingNumber = generateBookingNumber(lastSerial);

    const booking = await Booking.create({
      bookingNumber,
      patientId: new Types.ObjectId(userId),
      doctorId: new Types.ObjectId(doctorId),
      slotId: null,
      date,
      time,
      durationMins: Number(durationMins),
      mode,
      amount: fee,
      currency,
      petName,
      notes: notes || "",
      paymentMethod,
      status: "pending",
      paymentProvider: "stripe",
    } as any);

    try {
      const unitAmountMinor = Math.round(fee * 100);
      const frontendUrl = getFrontendUrl();

      const session = await stripe.checkout.sessions.create(
        {
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency,
                unit_amount: unitAmountMinor,
                product_data: { name: "Doctor consultation" },
              },
              quantity: 1,
            },
          ],
    success_url: `${frontendUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
cancel_url: `${frontendUrl}/payments/cancel`,
          metadata: {
            bookingId: String(booking._id),
            userId: String(userId),
            doctorId: String(doctorId),
          },
        },
        { idempotencyKey: `chk:${booking._id}:${userId}` }
      );

      await Booking.updateOne(
        { _id: booking._id },
        {
          $set: {
            paymentSessionId: session.id,
            paymentRedirectUrl: session.url || "",
          },
        }
      );

      return {
        bookingId: String(booking._id),
        redirectUrl: session.url ?? undefined,
      };
    } catch (err) {
      await Booking.deleteOne({ _id: booking._id });
      throw Object.assign(new Error("Failed to create payment session"), { status: 502 });
    }
  }
}