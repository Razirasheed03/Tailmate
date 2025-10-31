//doctor.schema.ts ///removing the any in each pages
import { Schema, model } from "mongoose";

const VerificationSchema = new Schema(
  {
    status: { type: String, enum: ["pending", "verified", "rejected","not_submitted"], default: "pending", required: true },
    certificateUrl: { type: String },
    rejectionReasons: [{ type: String }],
    submittedAt: { type: Date },
    verifiedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);
const ProfileSchema = new Schema(
{
displayName: { type: String },
bio: { type: String, maxlength: 5000 },
specialties: [{ type: String }],
experienceYears: { type: Number, min: 0, max: 80 },
licenseNumber: { type: String },
consultationFee: { type: Number, min: 0 },
avatarUrl: { type: String },
},
{ _id: false }
);

const DoctorSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true, unique: true, required: true },
    verification: { type: VerificationSchema, default: { status: "pending" } },
    profile: { type: ProfileSchema, default: {} },
  },
  { timestamps: true }
);

export const Doctor = model("Doctor", DoctorSchema);
