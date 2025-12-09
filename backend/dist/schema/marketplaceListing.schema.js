"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceListing = void 0;
// backend/src/schema/marketplaceListing.schema.ts (augment to include petId and sellerId)
const mongoose_1 = require("mongoose");
const HistorySchema = new mongoose_1.Schema({
    at: { type: Date, default: Date.now },
    action: { type: String, required: true },
    by: { type: mongoose_1.Types.ObjectId, ref: 'User', required: true },
    meta: { type: mongoose_1.Schema.Types.Mixed, default: null },
}, { _id: false });
const MarketplaceListingSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Types.ObjectId, ref: 'User', required: true, index: true }, // original seller field
    sellerId: { type: mongoose_1.Types.ObjectId, ref: 'User', required: true, index: true }, // mirror of userId to be explicit
    petId: { type: mongoose_1.Types.ObjectId, ref: 'Pet', required: true, index: true }, // REQUIRED
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 4000 },
    photos: { type: [String], default: [], validate: [(arr) => arr.length <= 6, 'Max 6 photos'] },
    price: { type: Number, default: null, min: 0 },
    type: { type: String, enum: ['sell', 'adopt'], required: true },
    status: { type: String, enum: ['active', 'reserved', 'closed'], default: 'active', index: true },
    ageText: { type: String, default: '', trim: true, maxlength: 60 },
    place: { type: String, required: true, trim: true, maxlength: 120, index: true },
    contact: { type: String, required: true, trim: true, maxlength: 60 },
    history: { type: [HistorySchema], default: [] },
    deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });
exports.MarketplaceListing = (0, mongoose_1.model)('MarketplaceListing', MarketplaceListingSchema);
