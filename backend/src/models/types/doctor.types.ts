// Add these additional types to your existing file
export type DoctorVerificationStatus = "pending" | "verified" | "rejected" | "not_submitted";

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
  reviewedBy?: string;
};

export type DoctorAttrs = {
  userId: string;
  verification: DoctorVerification;
  profile?: DoctorProfile;
};

// Add these new types for responses
export type DoctorListItem = {
  userId: string;
  username: string;
  email: string;
  status: DoctorVerificationStatus;
  certificateUrl?: string;
  submittedAt?: Date;
};

export type DoctorDetail = DoctorListItem & {
  verifiedAt?: Date;
  rejectionReasons?: string[];
  displayName?: string;
  bio?: string;
  specialties?: string[];
  experienceYears?: number;
  licenseNumber?: string;
  avatarUrl?: string;
  consultationFee?: number;
};

export type ListDoctorsParams = {
  page: number;
  limit: number;
  status?: string;
  search?: string;
};

export type ListDoctorsResponse = {
  data: DoctorListItem[];
  page: number;
  totalPages: number;
  total: number;
};