// src/dtos/admin/doctor.dto.ts
export interface DoctorListItemDTO {
  userId: string;
  username: string;
  email: string;
  status: "pending" | "verified" | "rejected";
  certificateUrl?: string;
  submittedAt?: Date;
}

export interface DoctorListResponseDTO {
  data: DoctorListItemDTO[];
  page: number;
  totalPages: number;
  total: number;
}

export interface DoctorDetailDTO {
  userId: string;
  username: string;
  email: string;
  status: "pending" | "verified" | "rejected";
  certificateUrl?: string;
  submittedAt?: Date;
  verifiedAt?: Date;
  rejectionReasons?: string[];
  displayName?: string;
  bio?: string;
  specialties?: string[];
  experienceYears?: number;
  licenseNumber?: string;
  avatarUrl?: string;
  consultationFee?: number;
}

export interface DoctorVerifyRequestDTO {
  userId: string;
  reviewerId: string;
}

export interface DoctorRejectRequestDTO {
  userId: string;
  reviewerId: string;
  reasons: string[];
}

export interface DoctorVerifyResponseDTO {
  status: "verified";
  verifiedAt: Date | null;
}

export interface DoctorRejectResponseDTO {
  status: "rejected";
  rejectionReasons: string[];
}
