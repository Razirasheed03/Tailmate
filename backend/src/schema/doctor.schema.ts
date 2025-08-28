import { Schema, model } from "mongoose";

const VerificationSchema = new Schema(
  {
    status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending", required: true },
    certificateUrl: { type: String },
    rejectionReasons: [{ type: String }],
    submittedAt: { type: Date },
    verifiedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

const DoctorSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true, unique: true, required: true },
    verification: { type: VerificationSchema, default: { status: "pending" } },
  },
  { timestamps: true }
);

export const Doctor = model("Doctor", DoctorSchema);
