import { Types } from "mongoose";
import { DoctorPublicRepository } from "../../repositories/implements/doctorPublic.repository";
import { Booking } from "../../schema/booking.schema";

type UIMode = "video" | "audio" | "inPerson";

function toUTCDate(date: string, time: string) {
  const d = new Date(`${date}T00:00:00Z`);
  const [h, m] = time.split(":").map(Number);
  d.setUTCHours(h || 0, m || 0, 0, 0);
  return d;
}

export class CheckoutService {
  constructor(private readonly pub = new DoctorPublicRepository()) {}

  private async verifyGeneratedSlot(
    doctorId: string,
    sel: { date: string; time: string; durationMins: number; mode: UIMode },
    opts?: { minLeadMinutes?: number }
  ) {
    if (!Types.ObjectId.isValid(doctorId)) return null;

    if (opts?.minLeadMinutes) {
      const start = toUTCDate(sel.date, sel.time);
      const diffMin = Math.floor((start.getTime() - Date.now()) / 60000);
      if (diffMin < opts.minLeadMinutes) return null;
    }

    const gen = await this.pub.listGeneratedAvailability(doctorId, { from: sel.date, to: sel.date });
    const match = gen.find(
      s =>
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

  // No tax: user pays exactly the slot fee
  async getQuote(userId: string, payload: any) {
    const { doctorId, date, time, durationMins, mode, baseFee } = payload || {};
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

  async createCheckout(userId: string, payload: any) {
    const { doctorId, date, time, durationMins, mode, amount, currency, petName, notes, paymentMethod, petId } = payload || {};
    if (!doctorId || !date || !time || !durationMins || !mode || amount == null || !currency || !petName || !paymentMethod) {
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

    // Amount must exactly equal the slot fee (no tax)
    const fee = Number(match.fee ?? amount ?? 0);

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
      paymentProvider: "mock",
    } as any);

    return { bookingId: String(booking._id), redirectUrl: "" };
  }

  async mockPay(userId: string, bookingId: string) {
    const updated = await Booking.findOneAndUpdate(
      { _id: new Types.ObjectId(bookingId), patientId: new Types.ObjectId(userId) },
      { $set: { status: "paid" } },
      { new: true }
    ).lean();
    if (!updated) throw Object.assign(new Error("Booking not found"), { status: 404 });
    return { bookingId: String(updated._id), status: updated.status };
  }
}
