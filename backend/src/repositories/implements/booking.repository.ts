// backend/src/repositories/implements/booking.repository.ts
import { Model, Types } from "mongoose";
import { Booking, type BookingAttrs, type BookingLean } from "../../schema/booking.schema";

export class BookingRepository {
  constructor(private readonly model: Model<BookingAttrs> = Booking) {}

  async create(attrs: {
    patientId: string;
    doctorId: string;
    slotId?: string | null;
    date: string;
    time: string;
    durationMins: number;
    mode: "video" | "audio" | "inPerson";
    amount: number;
    currency: string;
    petName: string;
    notes?: string;
    paymentMethod: "card" | "wallet";
    paymentProvider?: string;
    paymentSessionId?: string;
    paymentRedirectUrl?: string;
  }): Promise<BookingLean> {
    const doc = await this.model.create({
      patientId: new Types.ObjectId(attrs.patientId),
      doctorId: new Types.ObjectId(attrs.doctorId),
      slotId: attrs.slotId ? new Types.ObjectId(attrs.slotId) : null,
      date: attrs.date,
      time: attrs.time,
      durationMins: attrs.durationMins,
      mode: attrs.mode,
      amount: attrs.amount,
      currency: attrs.currency,
      petName: attrs.petName,
      notes: attrs.notes ?? "",
      paymentMethod: attrs.paymentMethod,
      status: "pending",
      paymentProvider: attrs.paymentProvider ?? "",
      paymentSessionId: attrs.paymentSessionId ?? "",
      paymentRedirectUrl: attrs.paymentRedirectUrl ?? "",
    });
    return doc.toObject() as BookingLean;
  }

  async markPaid(bookingId: string, sessionId?: string): Promise<BookingLean | null> {
    if (!Types.ObjectId.isValid(bookingId)) return null;
    const _id = new Types.ObjectId(bookingId);
    const updated = await this.model
      .findOneAndUpdate(
        { _id, status: "pending" },
        { $set: { status: "paid", paymentSessionId: sessionId ?? "" } },
        { new: true }
      )
      .lean<BookingLean>() // enforce lean shape
      .exec();
    return updated ?? null;
  }

  async updateStatus(
    bookingId: string,
    status: "pending" | "paid" | "cancelled" | "failed" | "refunded"
  ): Promise<BookingLean | null> {
    if (!Types.ObjectId.isValid(bookingId)) return null;
    const _id = new Types.ObjectId(bookingId);
    const updated = await this.model
      .findByIdAndUpdate(_id, { $set: { status } }, { new: true })
      .lean<BookingLean>() // enforce lean shape
      .exec();
    return updated ?? null;
  }

  async findById(bookingId: string): Promise<BookingLean | null> {
    if (!Types.ObjectId.isValid(bookingId)) return null;
    const _id = new Types.ObjectId(bookingId);
    const row = await this.model.findById(_id, null, { lean: true }).exec();
    return (row as unknown as BookingLean | null) ?? null;
  }
}
