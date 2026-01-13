import { Schema, model, Types } from "mongoose";

export type WalletHistoryOwnerType = "admin" | "doctor" | "user";
export type WalletHistoryDirection = "credit" | "debit";
export type WalletHistoryType =
  | "CONSULTATION_CANCEL_REFUND"
  | "CONSULTATION_CANCEL_DEDUCTION";

export interface WalletHistoryAttrs {
  ownerType: WalletHistoryOwnerType;
  ownerId?: Types.ObjectId;
  currency: string;
  amountMinor: number;
  direction: WalletHistoryDirection;
  type: WalletHistoryType;
  referenceId?: Types.ObjectId;
  bookingId?: Types.ObjectId;
  createdAt?: Date;
}

const WalletHistorySchema = new Schema<WalletHistoryAttrs>(
  {
    ownerType: { type: String, enum: ["admin", "doctor", "user"], required: true },
    ownerId: { type: Schema.Types.ObjectId, required: false, default: null },
    currency: { type: String, required: true },
    amountMinor: { type: Number, required: true },
    direction: { type: String, enum: ["credit", "debit"], required: true },
    type: {
      type: String,
      enum: ["CONSULTATION_CANCEL_REFUND", "CONSULTATION_CANCEL_DEDUCTION"],
      required: true,
    },
    referenceId: { type: Schema.Types.ObjectId, required: false, default: null },
    bookingId: { type: Schema.Types.ObjectId, required: false, default: null },
  },
  { timestamps: true }
);

WalletHistorySchema.index({ ownerType: 1, ownerId: 1, createdAt: -1 });
WalletHistorySchema.index({ type: 1, createdAt: -1 });

export const WalletHistory = model<WalletHistoryAttrs>(
  "WalletHistory",
  WalletHistorySchema
);
