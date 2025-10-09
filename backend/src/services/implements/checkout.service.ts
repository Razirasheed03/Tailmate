// backend/src/services/implements/checkout.service.ts
import { Types } from "mongoose";
import { DoctorPublicRepository } from "../../repositories/implements/doctorPublic.repository";
import { Booking } from "../../schema/booking.schema";
import { stripe } from "../../utils/stripe";

type UIMode = "video" | "audio" | "inPerson";

function toUTCDate(date: string, time: string) {
  const d = new Date(`${date}T00:00:00Z`);
  const [h, m] = time.split(":").map(Number);
  d.setUTCHours(h || 0, m || 0, 0, 0);
  return d;
}
 type QuoteRequest = {
  doctorId: string;
  date: string;         // ISO-YYYY-MM-DD
  time: string;         // HH:mm
  durationMins: number;
  mode: UIMode;
  baseFee?: number;
};
type QuoteResponse = {
  amount: number;      
  tax: number;         
  discount: number; 
  totalAmount: number;
  currency: "INR";
};
type CreateCheckoutRequest = {
  doctorId: string;
  date: string;         // ISO-YYYY-MM-DD
  time: string;         // HH:mm
  durationMins: number;
  mode: UIMode;
  amount: number;       // expected fee
  currency: string;     // e.g., 'INR'
  petName: string;
  notes?: string;
  paymentMethod: string;
  petId?: string;
};
type CreateCheckoutResponse = {
  bookingId: string;
  redirectUrl: string | null; 
};
type MockPayResponse = {
  bookingId: string;
  status: "pending" | "paid" | "canceled" | "expired";
}
type GeneratedSlot = {
  date: string;
  time: string;
  durationMins: number;
  modes: UIMode[];
  fee?: number;
}
export class CheckoutService {
  constructor(private readonly pub = new DoctorPublicRepository()) {}

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

    const gen: GeneratedSlot[] = await this.pub.listGeneratedAvailability(doctorId, {
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

  async getQuote(userId: string, payload: QuoteRequest): Promise<QuoteResponse> {
    const { doctorId, date, time, durationMins, mode, baseFee } = payload || ({} as QuoteRequest);
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

  async createCheckout(userId: string, payload: CreateCheckoutRequest): Promise<CreateCheckoutResponse> {
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
      petId,
    } = payload || ({} as CreateCheckoutRequest);

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

    const fee = Number(match.fee ?? amount ?? 0);

    // 1) Create booking as pending
    const booking = await Booking.create({
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
      // 2) Create Stripe Checkout Session (no Connect split)
      const unitAmountMinor = Math.round(fee * 100);
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
          success_url: `${process.env.APP_URL}/payments/Success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.APP_URL}/payments/cancel`,
          metadata: {
            bookingId: String(booking._id),
            userId: String(userId),
            doctorId: String(doctorId),
          },
        },
        { idempotencyKey: `chk:${booking._id}:${userId}` }
      ); // returns Stripe.Checkout.Session [web:59][web:60]

      // 3) Persist session identifiers
      await Booking.updateOne(
        { _id: booking._id },
        {
          $set: {
            paymentSessionId: session.id,
            paymentRedirectUrl: session.url || "",
          },
        }
      );

      // 4) Return hosted Checkout URL
      return { bookingId: String(booking._id), redirectUrl: session.url ?? null };
    } catch (err) {
      await Booking.deleteOne({ _id: booking._id });
      throw Object.assign(new Error("Failed to create payment session"), { status: 502 });
    }
  }

  async mockPay(userId: string, bookingId: string): Promise<MockPayResponse> {
    const updated = await Booking.findOneAndUpdate(
      {
        _id: new Types.ObjectId(bookingId),
        patientId: new Types.ObjectId(userId),
      },
      { $set: { status: "paid" } },
      { new: true }
    ).lean();

    if (!updated)
      throw Object.assign(new Error("Booking not found"), { status: 404 });

    return { bookingId: String(updated._id), status: updated.status as MockPayResponse["status"] };
  }
}
