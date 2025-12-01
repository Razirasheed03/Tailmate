// src/services/implements/admin.service.ts
import { IAdminService } from "../interfaces/admin.service.interface";
import { IUserRepository } from "../../repositories/interfaces/user.repository.interface";
import { IUserModel } from "../../models/interfaces/user.model.interface";
import { AdminRepository } from "../../repositories/implements/admin.repository";
import { PaymentModel } from "../../models/implements/payment.model";

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
import {
  UserMapper,
  DoctorMapper,
  PetCategoryMapper,
  EarningsMapper,
} from "../../mappers";

export class AdminService implements IAdminService {
  constructor(
    private _userRepo: IUserRepository,
    private _adminRepo: AdminRepository
  ) {}

  async getAllUsers(
    page = 1,
    limit = 10,
    search = ""
  ): Promise<UserListResponseDTO> {
    const result = await this._userRepo.getAllUsers(page, limit, search);
    return UserMapper.toUserListResponseDTO(
      result.users,
      result.total,
      result.page,
      result.totalPages
    );
  }
async blockUser(userId: string): Promise<UserActionResponseDTO> {
    await this._userRepo.updateUserBlockStatus(userId, true);
    return { message: "User blocked successfully" };
  }

  async unblockUser(userId: string): Promise<UserActionResponseDTO> {
    await this._userRepo.updateUserBlockStatus(userId, false);
    return { message: "User unblocked successfully" };
  }

  async deleteUser(userId: string): Promise<UserActionResponseDTO> {
    await this._userRepo.deleteUser(userId);
    return { message: "User deleted successfully" };
  }

  async getUserStats(): Promise<UserStatsDTO> {
    const stats = await this._userRepo.getUserStats();
    return UserMapper.toUserStatsDTO(stats);
  }
async listDoctors(
    page = 1,
    limit = 10,
    status = "",
    search = ""
  ): Promise<DoctorListResponseDTO> {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
    const result = await this._adminRepo.listDoctors({
      page: safePage,
      limit: safeLimit,
      status,
      search: search.trim(),
    });
    return DoctorMapper.toDoctorListResponseDTO(
      result.data,
      result.page,
      result.totalPages,
      result.total
    );
  }
  async verifyDoctor(
    userId: string,
    reviewerId: string
  ): Promise<DoctorVerifyResponseDTO> {
    if (!userId) throw new Error("userId required");
    if (!reviewerId) throw new Error("reviewerId required");
    const updated = await this._adminRepo.verifyDoctor(userId, reviewerId);
    return DoctorMapper.toDoctorVerifyResponseDTO({
      status: updated.verification?.status,
      verifiedAt: updated.verification?.verifiedAt,
    });
  }

  async rejectDoctor(
    userId: string,
    reviewerId: string,
    reasons: string[]
  ): Promise<DoctorRejectResponseDTO> {
    if (!userId) throw new Error("userId required");
    if (!reviewerId) throw new Error("reviewerId required");
    if (!Array.isArray(reasons) || reasons.length === 0)
      throw new Error("At least one reason is required");
    const updated = await this._adminRepo.rejectDoctor(
      userId,
      reviewerId,
      reasons
    );
    return DoctorMapper.toDoctorRejectResponseDTO({
      status: updated.verification?.status,
      rejectionReasons: updated.verification?.rejectionReasons,
    });
  }
   async getDoctorDetail(userId: string): Promise<DoctorDetailDTO> {
    if (!userId) throw new Error("userId required");
    const doctor = await this._adminRepo.getDoctorDetail(userId);
    return DoctorMapper.toDoctorDetailDTO(doctor);
  }
 async listPetCategories(
    page: number,
    limit: number,
    search?: string,
    active?: string
  ): Promise<PetCategoryListResponseDTO> {
    const result = await this._adminRepo.listPetCategories({
      page,
      limit,
      search,
      active,
    });
    return PetCategoryMapper.toPetCategoryListResponseDTO(
      result.data,
      result.page,
      result.totalPages,
      result.total
    );
  }

  async createPetCategory(payload: CreatePetCategoryDTO): Promise<PetCategoryDTO> {
    if (!payload?.name || !payload.name.trim())
      throw new Error("name is required");
    const created = await this._adminRepo.createPetCategory(
      PetCategoryMapper.toCreatePayload(payload)
    );
    return PetCategoryMapper.toPetCategoryDTO(created);
  }

async updatePetCategory(
    id: string,
    payload: UpdatePetCategoryDTO
  ): Promise<PetCategoryDTO | null> {
    const updated = await this._adminRepo.updatePetCategory(
      id,
      PetCategoryMapper.toUpdatePayload(payload)
    );
    return updated ? PetCategoryMapper.toPetCategoryDTO(updated) : null;
  }

  async deletePetCategory(id: string): Promise<boolean> {
    return this._adminRepo.deletePetCategory(id);
  }

  async getEarningsByDoctor(): Promise<EarningsResponseDTO> {
    const pipeline = [
      { $match: { paymentStatus: "success" } },
      {
        $group: {
          _id: "$doctorId",
          totalEarnings: { $sum: "$platformFee" },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: "$doctor" },
    ];
    const results = await PaymentModel.aggregate(pipeline);
    return EarningsMapper.toEarningsResponseDTO(results);
  }
  async getBookingStatusChart() {
    const data = await this._adminRepo.getBookingStatusCounts();
    return data;
  }

}
