import { IUser } from "../../models/interfaces/IUser";

export interface IAdminService {
  getAllUsers(page?: number, limit?: number, search?: string): Promise<{
    users: IUser[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  blockUser(userId: string): Promise<{ message: string }>;
  unblockUser(userId: string): Promise<{ message: string }>;
  deleteUser(userId: string): Promise<{ message: string }>;
  getUserStats(): Promise<{
    totalUsers: number;
    totalDoctors: number;

    blockedUsers: number;
  }>;
}
