// src/services/interfaces/admin.service.interface.ts
import {
  UserListResponseDTO,
  UserStatsDTO,
  UserActionResponseDTO,
  DoctorListResponseDTO,
  DoctorDetailDTO,
  DoctorVerifyResponseDTO,
  DoctorRejectResponseDTO,
  PetCategoryListResponseDTO,
  PetCategoryDTO,
  CreatePetCategoryDTO,
  UpdatePetCategoryDTO,
  EarningsResponseDTO,
} from "../../dtos";

export interface IAdminService {
  getAllUsers(page: number, limit: number, search: string): Promise<UserListResponseDTO>;
  blockUser(userId: string): Promise<UserActionResponseDTO>;
  unblockUser(userId: string): Promise<UserActionResponseDTO>;
  deleteUser(userId: string): Promise<UserActionResponseDTO>;
  getUserStats(): Promise<UserStatsDTO>;
  listDoctors(page: number, limit: number, status: string, search: string): Promise<DoctorListResponseDTO>;
  verifyDoctor(userId: string, reviewerId: string): Promise<DoctorVerifyResponseDTO>;
  rejectDoctor(userId: string, reviewerId: string, reasons: string[]): Promise<DoctorRejectResponseDTO>;
  getDoctorDetail(userId: string): Promise<DoctorDetailDTO>;
  listPetCategories(page: number, limit: number, search?: string, active?: string): Promise<PetCategoryListResponseDTO>;
  createPetCategory(payload: CreatePetCategoryDTO): Promise<PetCategoryDTO>;
  updatePetCategory(id: string, payload: UpdatePetCategoryDTO): Promise<PetCategoryDTO | null>;
  deletePetCategory(id: string): Promise<boolean>;
  getEarningsByDoctor(): Promise<EarningsResponseDTO>;
  getBookingStatusChart(): Promise<{
    pending: number;
    completed: number;
    cancelled: number;
  }>;
getFilteredEarnings(
  start?: string,
  end?: string,
  doctorId?: string
): Promise<{
  totalRevenue: number;
  totalPlatformFee: number;
  totalDoctorEarnings: number;
  count: number;
}>;

  getSimpleDoctorList(): Promise<
    Array<{
      _id: string;
      username: string;
      email?: string;
    }>
  >;

}
