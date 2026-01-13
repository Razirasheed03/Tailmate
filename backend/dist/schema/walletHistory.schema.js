"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletHistory = void 0;
const mongoose_1 = require("mongoose");
const WalletHistorySchema = new mongoose_1.Schema({
    ownerType: { type: String, enum: ["admin", "doctor", "user"], required: true },
    ownerId: { type: mongoose_1.Schema.Types.ObjectId, required: false, default: null },
    currency: { type: String, required: true },
    amountMinor: { type: Number, required: true },
    direction: { type: String, enum: ["credit", "debit"], required: true },
    type: {
        type: String,
        enum: ["CONSULTATION_CANCEL_REFUND", "CONSULTATION_CANCEL_DEDUCTION"],
        required: true,
    },
    referenceId: { type: mongoose_1.Schema.Types.ObjectId, required: false, default: null },
    bookingId: { type: mongoose_1.Schema.Types.ObjectId, required: false, default: null },
}, { timestamps: true });
WalletHistorySchema.index({ ownerType: 1, ownerId: 1, createdAt: -1 });
WalletHistorySchema.index({ type: 1, createdAt: -1 });
exports.WalletHistory = (0, mongoose_1.model)("WalletHistory", WalletHistorySchema);
