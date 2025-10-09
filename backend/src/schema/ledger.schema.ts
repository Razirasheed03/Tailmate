//schema/ledger.schema.ts
import { Schema, model, Types } from "mongoose";
export const LedgerSchema = new Schema({
  walletId: { type: Types.ObjectId, ref: "Wallet", required: true },
  direction: { type: String, enum: ["credit", "debit"], required: true },
  amountMinor: { type: Number, required: true },
  currency: { type: String, required: true },
  bookingId: { type: Types.ObjectId, required: false },
  paymentIntentId: { type: String, required: true },
  type: { type: String, enum: ["commission", "earnings", "refund", "reversal"], required: true },
  idempotencyKey: { type: String, required: true, unique: true }, // e.g., `${paymentIntentId}:${type}`
}, { timestamps: true });
LedgerSchema.index({ idempotencyKey: 1 }, { unique: true });
LedgerSchema.index({ paymentIntentId: 1 }); 
export const Ledger = model("Ledger", LedgerSchema);