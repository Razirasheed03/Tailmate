export type DoctorVerificationStatus = "pending" | "verified" | "rejected";

export type DoctorProfile = {
  displayName?: string;
  bio?: string;
  specialties?: string[];
  experienceYears?: number;
  licenseNumber?: string;
  consultationFee?: number;
  avatarUrl?: string;
};

export type DoctorVerification = {
  status: DoctorVerificationStatus;
  certificateUrl?: string;
  rejectionReasons?: string[];
  submittedAt?: Date;
  verifiedAt?: Date;
  reviewedBy?: string; // or Types.ObjectId as string
};

export type DoctorAttrs = {
  userId: string;
  verification: DoctorVerification;
  profile?: DoctorProfile;
};
