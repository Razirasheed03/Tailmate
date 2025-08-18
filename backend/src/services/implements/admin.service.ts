import { IAdminService } from "../interfaces/admin.service.interface";
import { IUserRepository } from "../../repositories/interfaces/user.repository.interface";
import { IUserModel } from "../../models/interfaces/user.model.interface";


export class AdminService implements IAdminService {
  constructor(private _userRepo: IUserRepository) {}

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
    // Service hands through repo result (totalUsers, totalDoctors, totalPatients, blockedUsers)
    const stats = await this._userRepo.getUserStats();
    // If your IAdminService interface only includes totalUsers/totalDoctors/blockedUsers,
    // either extend the interface or drop totalPatients here.
    const { totalUsers, totalDoctors, blockedUsers } = stats;
    return { totalUsers, totalDoctors, blockedUsers };
  }
}
