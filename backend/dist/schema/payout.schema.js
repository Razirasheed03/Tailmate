"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payout = void 0;
// backend/src/schema/payout.schema.ts
const mongoose_1 = require("mongoose");
const PayoutSchema = new mongoose_1.Schema({
    ownerType: { type: String, enum: ["user", "doctor"], required: true },
    ownerId: { type: mongoose_1.Types.ObjectId, required: true },
    amountMinor: { type: Number, required: true }, // in minor units (e.g., paise/cents)
    currency: { type: String, required: true },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    requestedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    failureReason: { type: String },
});
exports.Payout = (0, mongoose_1.model)("Payout", PayoutSchema);
