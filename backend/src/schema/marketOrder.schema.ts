// backend/src/schema/marketOrder.schema.ts
import { Schema, model, Types } from "mongoose";

const MarketOrderSchema = new Schema({
  listingId: { type: Types.ObjectId, required: true, index: true },
  petId: { type: Types.ObjectId, required: true, index: true },
  buyerId: { type: Types.ObjectId, required: true, index: true },
  sellerId: { type: Types.ObjectId, required: true, index: true },
  amount: { type: Number, required: true }, // major units (e.g., rupees)
  platformFee: { type: Number, default: null },
  sellerEarning: { type: Number, default: null },
  currency: { type: String, default: "INR" },
  stripeSessionId: { type: String, default: null },
  paymentIntentId: { type: String, default: null },
  chargeId: { type: String, default: null }, // nullable
  walletCredited: { type: Boolean, default: false },
  walletCreditedAt: { type: Date, default: null },
  status: { type: String, enum: ["created", "paid", "failed"], default: "created", index: true },
}, { timestamps: true });

export const MarketOrder = model("MarketOrder", MarketOrderSchema);
