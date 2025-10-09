// backend/src/schema/wallet.schema.ts
import { Schema, model, Types } from "mongoose";

export const WalletSchema = new Schema({
  ownerType: { type: String, enum: ["admin", "doctor"], required: true },
  ownerId: { type: Types.ObjectId, required: false }, // null/absent for admin
  currency: { type: String, required: true },         // e.g., "INR"
  balanceMinor: { type: Number, required: true, default: 0 }, // integer
}, { timestamps: true });

WalletSchema.index({ ownerType: 1, ownerId: 1, currency: 1 }, { unique: true })
export const Wallet = model("Wallet", WalletSchema);
