"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorMapper = void 0;
class DoctorMapper {
    static toDoctorListItemDTO(doctor) {
        var _a;
        return {
            userId: ((_a = doctor.userId) === null || _a === void 0 ? void 0 : _a.toString()) || "",
            username: doctor.username || "",
            email: doctor.email || "",
            status: doctor.status || "pending",
            certificateUrl: doctor.certificateUrl,
            submittedAt: doctor.submittedAt,
        };
    }
    static toDoctorListResponseDTO(data, page, totalPages, total) {
        return {
            data: data.map((doc) => this.toDoctorListItemDTO(doc)),
            page,
            totalPages,
            total,
        };
    }
    static toDoctorDetailDTO(doctor) {
        var _a;
        return {
            userId: ((_a = doctor.userId) === null || _a === void 0 ? void 0 : _a.toString()) || "",
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
    static toDoctorVerifyResponseDTO(verificationData) {
        return {
            status: "verified",
            verifiedAt: verificationData.verifiedAt || null,
        };
    }
    static toDoctorRejectResponseDTO(rejectionData) {
        return {
            status: "rejected",
            rejectionReasons: rejectionData.rejectionReasons || [],
        };
    }
}
exports.DoctorMapper = DoctorMapper;
