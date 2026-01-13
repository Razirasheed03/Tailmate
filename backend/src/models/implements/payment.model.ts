//models/implements/payment.model.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPayment extends Document {
  patientId: Types.ObjectId | string;
  doctorId: Types.ObjectId | string;   // doctor’s User _id
  bookingId: Types.ObjectId | string;

  amount: number;          // rupees, not minor units
  platformFee: number;     // 20% of amount
  doctorEarning: number;   // 80% of amount
  currency: string;        // "INR"

  paymentStatus: "pending" | "success" | "failed" | "refunded";
  paymentIntentId?: string;
  receiptUrl?: string;

  walletCredited?: boolean;
  walletCreditedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },

    amount: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    doctorEarning: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    paymentStatus: {
      type: String,
      enum: ["pending", "success", "failed","refunded"],
      default: "pending",
      index: true,
    },

    paymentIntentId: String,
    receiptUrl: String,

    walletCredited: { type: Boolean, default: false },
    walletCreditedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

PaymentSchema.index({ doctorId: 1, createdAt: -1 });

export const PaymentModel = mongoose.model<IPayment>("Payment", PaymentSchema);
