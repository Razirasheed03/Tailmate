"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = exports.WalletSchema = void 0;
// backend/src/schema/wallet.schema.ts
const mongoose_1 = require("mongoose");
exports.WalletSchema = new mongoose_1.Schema({
    ownerType: { type: String, enum: ["admin", "doctor", "user"], required: true },
    ownerId: { type: mongoose_1.Types.ObjectId, required: false }, // null/absent for admin
    currency: { type: String, required: true }, // e.g., "INR"
    balanceMinor: { type: Number, required: true, default: 0 }, // integer
}, { timestamps: true });
exports.WalletSchema.index({ ownerType: 1, ownerId: 1, currency: 1 }, { unique: true });
exports.Wallet = (0, mongoose_1.model)("Wallet", exports.WalletSchema);
