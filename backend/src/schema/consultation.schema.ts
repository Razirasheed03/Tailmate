//consultation.schema.ts
import { Schema, model, Types } from "mongoose";

const ConsultationSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    doctorId: { type: Types.ObjectId, ref: "Doctor", required: true, index: true },
    bookingId: { type: String, default: null },
    
    scheduledFor: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, required: true, default: 30 },
    
    status: {
      type: String,
      enum: ["upcoming", "in_progress", "completed", "cancelled", "cancelled_by_doctor"],
      default: "upcoming",
      index: true,
    },
    
    videoRoomId: { type: String, default: null },
    callStartedAt: { type: Date, default: null },
    callEndedAt: { type: Date, default: null },
    
    notes: { type: String, default: null },
    cancelledBy: { type: Types.ObjectId, ref: "User", default: null },
    cancelledByRole: {
      type: String,
      enum: ["doctor", "user", "system"],
      default: null,
    },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: null },
  },
  { timestamps: true }
);

// Index for finding consultations by user and doctor
ConsultationSchema.index({ userId: 1, doctorId: 1 });
ConsultationSchema.index({ scheduledFor: 1, status: 1 });
// UNIQUE Index for bookingId (to ensure only one consultation per booking) - sparse to allow null
ConsultationSchema.index({ bookingId: 1 }, { sparse: true, unique: true });
// Index for videoRoomId (non-unique to allow multiple null values)
ConsultationSchema.index({ videoRoomId: 1 }, { sparse: true });

export const Consultation = model("Consultation", ConsultationSchema);
