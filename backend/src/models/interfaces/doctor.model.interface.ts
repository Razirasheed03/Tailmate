// backend/src/models/interfaces/doctor.model.interface.ts
import { Document, Types } from "mongoose";

export type DoctorVerificationStatus = "not_submitted" | "pending" | "verified" | "rejected";

export interface IDoctorVerification {
  status: DoctorVerificationStatus;
  certificateUrl?: string;
  rejectionReasons?: string[];
  submittedAt?: Date;
  verifiedAt?: Date;
  reviewedBy?: Types.ObjectId;
}

export interface IDoctorProfile {
  displayName?: string;
  bio?: string;
  specialties?: string[];
  experienceYears?: number;
  licenseNumber?: string;
  consultationFee?: number;
  avatarUrl?: string;
}

export interface IDoctorModel extends Document {
  userId: Types.ObjectId;
  verification: IDoctorVerification;
  profile: IDoctorProfile;
  createdAt?: Date;
  updatedAt?: Date;
}

// DTOs for updates
export interface UpdateProfileDTO {
  displayName?: string;
  bio?: string;
  specialties?: string[];
  experienceYears?: number;
  licenseNumber?: string;
  avatarUrl?: string;
  consultationFee?: number;
}