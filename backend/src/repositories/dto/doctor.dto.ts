export type DoctorVerificationDTO = {
  status: "pending" | "verified" | "rejected";
  certificateUrl?: string | null;
  rejectionReasons: string[];
  submittedAt?: Date | null;
  verifiedAt?: Date | null;
  reviewedBy?: string | null;
};

export type DoctorProfileDTO = {
  displayName?: string;
  bio?: string;
  specialties?: string[];
  experienceYears?: number;
  licenseNumber?: string;
  consultationFee?: number;
  avatarUrl?: string;
};
