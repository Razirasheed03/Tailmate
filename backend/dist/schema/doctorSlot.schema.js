"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorSlot = void 0;
// backend/src/schema/doctorSlot.schema.ts
const mongoose_1 = require("mongoose");
const DoctorSlotSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    durationMins: { type: Number, min: 5, max: 120, required: true },
    fee: { type: Number, min: 0, default: 0 },
    modes: { type: [String], enum: ["video", "audio", "inPerson"], default: ["video"], required: true },
    status: { type: String, enum: ["available", "booked"], default: "available", required: true },
}, { timestamps: true });
// Unique start per user+date
DoctorSlotSchema.index({ userId: 1, date: 1, time: 1 }, { unique: true });
exports.DoctorSlot = (0, mongoose_1.model)("DoctorSlot", DoctorSlotSchema);
