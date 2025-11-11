// src/mappers/admin/doctor.mapper.ts
import {
  DoctorListItemDTO,
  DoctorListResponseDTO,
  DoctorDetailDTO,
  DoctorVerifyResponseDTO,
  DoctorRejectResponseDTO,
} from "../../dtos/admin/doctor.dto";

export class DoctorMapper {
  static toDoctorListItemDTO(doctor: any): DoctorListItemDTO {
    return {
      userId: doctor.userId?.toString() || "",
      username: doctor.username || "",
      email: doctor.email || "",
      status: doctor.status || "pending",
      certificateUrl: doctor.certificateUrl,
      submittedAt: doctor.submittedAt,
    };
  }

  static toDoctorListResponseDTO(
    data: any[],
    page: number,
    totalPages: number,
    total: number
  ): DoctorListResponseDTO {
    return {
      data: data.map((doc) => this.toDoctorListItemDTO(doc)),
      page,
      totalPages,
      total,
    };
  }

  static toDoctorDetailDTO(doctor: any): DoctorDetailDTO {
    return {
      userId: doctor.userId?.toString() || "",
      username: doctor.username || "",
      email: doctor.email || "",
      status: doctor.status || "pending",
      certificateUrl: doctor.certificateUrl,
      submittedAt: doctor.submittedAt,
      verifiedAt: doctor.verifiedAt,
      rejectionReasons: doctor.rejectionReasons || [],
      displayName: doctor.displayName,
      bio: doctor.bio,
      specialties: doctor.specialties || [],
      experienceYears: doctor.experienceYears,
      licenseNumber: doctor.licenseNumber,
      avatarUrl: doctor.avatarUrl,
      consultationFee: doctor.consultationFee,
    };
  }

  static toDoctorVerifyResponseDTO(
    verificationData: any
  ): DoctorVerifyResponseDTO {
    return {
      status: "verified",
      verifiedAt: verificationData.verifiedAt || null,
    };
  }

  static toDoctorRejectResponseDTO(
    rejectionData: any
  ): DoctorRejectResponseDTO {
    return {
      status: "rejected",
      rejectionReasons: rejectionData.rejectionReasons || [],
    };
  }
}
