"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ledger = exports.LedgerSchema = void 0;
//schema/ledger.schema.ts
const mongoose_1 = require("mongoose");
exports.LedgerSchema = new mongoose_1.Schema({
    walletId: { type: mongoose_1.Types.ObjectId, ref: "Wallet", required: true },
    direction: { type: String, enum: ["credit", "debit"], required: true },
    amountMinor: { type: Number, required: true },
    currency: { type: String, required: true },
    bookingId: { type: mongoose_1.Types.ObjectId, required: false },
    paymentIntentId: { type: String, required: true },
    type: { type: String, enum: ["commission", "earnings", "refund", "reversal"], required: true },
    idempotencyKey: { type: String, required: true, unique: true }, // e.g., `${paymentIntentId}:${type}`
}, { timestamps: true });
exports.LedgerSchema.index({ idempotencyKey: 1 }, { unique: true });
exports.LedgerSchema.index({ paymentIntentId: 1 });
exports.Ledger = (0, mongoose_1.model)("Ledger", exports.LedgerSchema);
