import { IUser } from "../../models/interfaces/IUser";
import { IUserDoc } from "../../models/implements/UserModel";

export interface IUserRepository {
  createUser(user: IUser): Promise<IUserDoc>;
  findByEmail(email: string): Promise<IUserDoc | null>;
  findById(id: string): Promise<IUserDoc | null>;

  getAllUsers(page?: number, limit?: number, search?: string): Promise<{
    users: IUserDoc[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  updateUserBlockStatus(userId: string, isBlocked: boolean): Promise<IUserDoc>;
  deleteUser(userId: string): Promise<void>;
  getUserStats(): Promise<{
    totalUsers: number;
    totalDoctors: number;
    blockedUsers: number;
  }>;
}
