// src/services/implements/admin.service.ts
import { IAdminService } from "../interfaces/admin.service.interface";
import { IUserRepository } from "../../repositories/interfaces/user.repository.interface";
import { IUserModel } from "../../models/interfaces/user.model.interface";
import { AdminRepository } from "../../repositories/implements/admin.repository";

export class AdminService implements IAdminService {
  constructor(
    private _userRepo: IUserRepository,
    private _adminRepo: AdminRepository
  ) {}

  async getAllUsers(
    page = 1,
    limit = 10,
    search = ""
  ): Promise<{
    users: Omit<IUserModel, "password">[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return await this._userRepo.getAllUsers(page, limit, search);
  }

  async blockUser(userId: string) {
    await this._userRepo.updateUserBlockStatus(userId, true);
    return { message: "User blocked successfully" };
  }

  async unblockUser(userId: string) {
    await this._userRepo.updateUserBlockStatus(userId, false);
    return { message: "User unblocked successfully" };
  }

  async deleteUser(userId: string) {
    await this._userRepo.deleteUser(userId);
    return { message: "User deleted successfully" };
  }

  async getUserStats() {
    const stats = await this._userRepo.getUserStats();
    const { totalUsers, totalDoctors, blockedUsers } = stats;
    return { totalUsers, totalDoctors, blockedUsers };
  }

  async listDoctors(page = 1, limit = 10, status = "", search = "") {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
    return this._adminRepo.listDoctors({
      page: safePage,
      limit: safeLimit,
      status,
      search: search.trim(),
    });
  }

  async verifyDoctor(userId: string, reviewerId: string) {
    if (!userId) throw new Error("userId required");
    if (!reviewerId) throw new Error("reviewerId required");
    const updated = await this._adminRepo.verifyDoctor(userId, reviewerId);
    return {
      status: updated.verification?.status as "verified",
      verifiedAt: updated.verification?.verifiedAt,
    };
  }

  async rejectDoctor(userId: string, reviewerId: string, reasons: string[]) {
    if (!userId) throw new Error("userId required");
    if (!reviewerId) throw new Error("reviewerId required");
    if (!Array.isArray(reasons) || reasons.length === 0)
      throw new Error("At least one reason is required");
    const updated = await this._adminRepo.rejectDoctor(userId, reviewerId, reasons);
    return {
      status: updated.verification?.status as "rejected",
      rejectionReasons: updated.verification?.rejectionReasons || [],
    };
  }
}
