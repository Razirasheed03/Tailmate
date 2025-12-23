"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchmakingListing = void 0;
const mongoose_1 = require("mongoose");
const MatchEventSchema = new mongoose_1.Schema({
    at: { type: Date, default: Date.now },
    action: { type: String, required: true },
    by: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    meta: { type: mongoose_1.Schema.Types.Mixed, default: null },
}, { _id: false });
const MatchmakingListingSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Types.ObjectId, ref: "User", required: true, index: true },
    petId: { type: mongoose_1.Types.ObjectId, ref: "Pet", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    photos: { type: [String], default: [] },
    place: { type: String },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], index: "2dsphere" },
    },
    contact: { type: String, required: true, trim: true },
    status: {
        type: String,
        enum: ["active", "matched", "closed"],
        default: "active",
    },
    deletedAt: { type: Date, default: null },
    history: { type: [MatchEventSchema], default: [] },
}, { timestamps: true });
MatchmakingListingSchema.index({ createdAt: -1 });
MatchmakingListingSchema.index({ place: 1 });
exports.MatchmakingListing = (0, mongoose_1.model)("MatchmakingListing", MatchmakingListingSchema);
