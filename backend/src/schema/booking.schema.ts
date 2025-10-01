// backend/src/schema/booking.schema.ts
import { Schema, model, Types, HydratedDocument } from "mongoose";

export type UIMode = "video" | "audio" | "inPerson";
export type PaymentMethod = "upi" | "card" | "netbanking" | "wallet";
export type BookingStatus = "pending" | "paid" | "cancelled" | "failed" | "refunded";

export interface BookingAttrs {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  slotId?: Types.ObjectId | null;
  date: string;
  time: string;
  durationMins: number;
  mode: UIMode;
  amount: number;
  currency: string;
  petName: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  status: BookingStatus;
  paymentProvider?: string;
  paymentSessionId?: string;
  paymentRedirectUrl?: string;
}

export type BookingDoc = HydratedDocument<BookingAttrs>;

export type BookingLean = {
  _id: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  slotId?: Types.ObjectId | null;
  date: string;
  time: string;
  durationMins: number;
  mode: UIMode;
  amount: number;
  currency: string;
  petName: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  status: BookingStatus;
  paymentProvider?: string;
  paymentSessionId?: string;
  paymentRedirectUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const BookingSchema = new Schema<BookingAttrs>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    slotId: { type: Schema.Types.ObjectId, ref: "DoctorSlot", default: null },
    date: { type: String, required: true, index: true },
    time: { type: String, required: true },
    durationMins: { type: Number, required: true, min: 5, max: 120 },
    mode: { type: String, enum: ["video", "audio", "inPerson"], required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    petName: { type: String, required: true },
    notes: { type: String, default: "" },
    paymentMethod: { type: String, enum: ["upi", "card", "netbanking", "wallet"], required: true },
    status: { type: String, enum: ["pending", "paid", "cancelled", "failed", "refunded"], default: "pending", index: true },
    paymentProvider: { type: String, default: "" },
    paymentSessionId: { type: String, default: "" },
    paymentRedirectUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

BookingSchema.index({ patientId: 1, doctorId: 1, date: 1, time: 1, status: 1 });

export const Booking = model<BookingAttrs>("Booking", BookingSchema);
