"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Consultation = void 0;
//consultation.schema.ts
const mongoose_1 = require("mongoose");
const ConsultationSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Types.ObjectId, ref: "User", required: true, index: true },
    doctorId: { type: mongoose_1.Types.ObjectId, ref: "Doctor", required: true, index: true },
    bookingId: { type: String, default: null },
    scheduledFor: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, required: true, default: 30 },
    status: {
        type: String,
        enum: ["upcoming", "in_progress", "completed", "cancelled"],
        default: "upcoming",
        index: true,
    },
    videoRoomId: { type: String, default: null },
    callStartedAt: { type: Date, default: null },
    callEndedAt: { type: Date, default: null },
    notes: { type: String, default: null },
    cancelledBy: { type: mongoose_1.Types.ObjectId, ref: "User", default: null },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: null },
}, { timestamps: true });
// Index for finding consultations by user and doctor
ConsultationSchema.index({ userId: 1, doctorId: 1 });
ConsultationSchema.index({ scheduledFor: 1, status: 1 });
// UNIQUE Index for bookingId (to ensure only one consultation per booking) - sparse to allow null
ConsultationSchema.index({ bookingId: 1 }, { sparse: true, unique: true });
// Index for videoRoomId (non-unique to allow multiple null values)
ConsultationSchema.index({ videoRoomId: 1 }, { sparse: true });
exports.Consultation = (0, mongoose_1.model)("Consultation", ConsultationSchema);
