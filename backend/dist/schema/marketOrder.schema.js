"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketOrder = void 0;
// backend/src/schema/marketOrder.schema.ts
const mongoose_1 = require("mongoose");
const MarketOrderSchema = new mongoose_1.Schema({
    listingId: { type: mongoose_1.Types.ObjectId, required: true, index: true },
    petId: { type: mongoose_1.Types.ObjectId, required: true, index: true },
    buyerId: { type: mongoose_1.Types.ObjectId, required: true, index: true },
    sellerId: { type: mongoose_1.Types.ObjectId, required: true, index: true },
    amount: { type: Number, required: true }, // major units (e.g., rupees)
    currency: { type: String, default: "INR" },
    stripeSessionId: { type: String, default: null },
    paymentIntentId: { type: String, default: null },
    chargeId: { type: String, default: null }, // nullable
    status: { type: String, enum: ["created", "paid", "failed"], default: "created", index: true }, // no "transferred" since we do internal wallet
}, { timestamps: true });
exports.MarketOrder = (0, mongoose_1.model)("MarketOrder", MarketOrderSchema);
