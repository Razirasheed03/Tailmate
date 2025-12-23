"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Booking = void 0;
// backend/src/schema/booking.schema.ts
const mongoose_1 = require("mongoose");
const BookingSchema = new mongoose_1.Schema({
    patientId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    doctorId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    slotId: { type: mongoose_1.Schema.Types.ObjectId, ref: "DoctorSlot", default: null },
    date: { type: String, required: true, index: true },
    time: { type: String, required: true },
    durationMins: { type: Number, required: true, min: 5, max: 120 },
    mode: { type: String, enum: ["video", "audio", "inPerson"], required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    petName: { type: String, required: true },
    notes: { type: String, default: "" },
    paymentMethod: { type: String, enum: ["upi", "card", "netbanking", "wallet"], required: true },
    status: { type: String, enum: ["pending", "paid", "cancelled", "failed", "refunded"], default: "pending", index: true },
    paymentProvider: { type: String, default: "" },
    paymentSessionId: { type: String, default: "" },
    paymentRedirectUrl: { type: String, default: "" },
    bookingNumber: { type: String, required: true, unique: true },
}, { timestamps: true });
BookingSchema.index({ doctorId: 1, date: 1, time: 1 }, { unique: true, partialFilterExpression: { status: { $in: ["pending", "paid"] } } });
exports.Booking = (0, mongoose_1.model)("Booking", BookingSchema);
