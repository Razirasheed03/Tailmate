"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pet = void 0;
// backend/src/schema/pet.schema.ts
const mongoose_1 = require("mongoose");
const PetEventSchema = new mongoose_1.Schema({
    at: { type: Date, default: Date.now },
    action: { type: String, required: true },
    by: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    meta: { type: mongoose_1.Schema.Types.Mixed, default: null },
}, { _id: false });
const PetSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    currentOwnerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    name: { type: String, required: true, trim: true },
    speciesCategoryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "PetCategory",
        required: true,
    },
    speciesCategoryName: { type: String, required: true, trim: true },
    breedId: { type: mongoose_1.Schema.Types.ObjectId, ref: "PetBreed", default: null },
    breedName: { type: String, default: null },
    sex: {
        type: String,
        enum: ["male", "female", "unknown"],
        default: "unknown",
    },
    birthDate: { type: Date, default: null },
    ageDisplay: { type: String, default: null },
    notes: { type: String, maxlength: 1000, default: null },
    photoUrl: { type: String, default: null },
    deletedAt: { type: Date, default: null },
    history: { type: [PetEventSchema], default: [] },
}, { timestamps: true });
PetSchema.index({ userId: 1, createdAt: -1 });
PetSchema.index({ currentOwnerId: 1, createdAt: -1 });
PetSchema.index({ userId: 1, currentOwnerId: 1 });
exports.Pet = (0, mongoose_1.model)("Pet", PetSchema);
