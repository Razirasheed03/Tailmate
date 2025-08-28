// backend/src/models/interfaces/doctor.model.interface.ts
import { Document, Types } from "mongoose";
export type DoctorVerificationStatus = "pending" | "verified" | "rejected";

export interface IDoctorModel extends Document {
  userId: Types.ObjectId;
  verification: {
    status: DoctorVerificationStatus;
    certificateUrl?: string;
    rejectionReasons?: string[];
    submittedAt?: Date;
    verifiedAt?: Date;
    reviewedBy?: Types.ObjectId;
  };
  profile?: {
    displayName?: string;
    bio?: string;
    specialties?: string[];
    experienceYears?: number;
    licenseNumber?: string;
    consultationFee?: number;
    avatarUrl?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
