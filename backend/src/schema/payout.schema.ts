// backend/src/schema/payout.schema.ts
import { Schema, model, Types } from "mongoose";

const PayoutSchema = new Schema({
  ownerType: { type: String, enum: ["user", "doctor"], required: true },
  ownerId: { type: Types.ObjectId, required: true },
  amountMinor: { type: Number, required: true }, // in minor units (e.g., paise/cents)
  currency: { type: String, required: true },
  status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  requestedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  failureReason: { type: String },
});

export const Payout = model("Payout", PayoutSchema);
