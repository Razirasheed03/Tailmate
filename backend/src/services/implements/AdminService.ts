import { IAdminService } from "../interfaces/IAdminService";
import { IUserRepository } from "../../repositories/interfaces/IUserRepository";
import { IUser } from "../../models/interfaces/IUser";

export class AdminService implements IAdminService {
  constructor(private _userRepo: IUserRepository) {}

  async getAllUsers(page = 1, limit = 10, search = ""): Promise<{
    users: IUser[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const result = await this._userRepo.getAllUsers(page, limit, search);
    return {
      users: result.users.map(user => ({
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        isDoctor: user.isDoctor,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })) as IUser[],
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    };
  }

  async blockUser(userId: string): Promise<{ message: string }> {
    await this._userRepo.updateUserBlockStatus(userId, true);
    return { message: "User blocked successfully" };
  }

  async unblockUser(userId: string): Promise<{ message: string }> {
    await this._userRepo.updateUserBlockStatus(userId, false);
    return { message: "User unblocked successfully" };
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    await this._userRepo.deleteUser(userId);
    return { message: "User deleted successfully" };
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    totalDoctors: number;
    totalPatients: number;
    blockedUsers: number;
  }> {
    return await this._userRepo.getUserStats();
  }
}
