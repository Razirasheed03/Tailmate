import { BaseRepository } from "../baseRepo";
import { IUserRepository } from "../interfaces/IUserRepository";
import { IUser } from "../../models/interfaces/IUser";
import { UserModel, IUserDoc } from "../../models/implements/UserModel";

export class UserRepository extends BaseRepository<IUserDoc> implements IUserRepository {
  constructor() {
    super(UserModel);
  }

  async createUser(user: IUser): Promise<IUserDoc> {
    return await super.create(user);
  }

  async findByEmail(email: string): Promise<IUserDoc | null> {
    return await this.model.findOne({ email });
  }
  async findById(id: string): Promise<IUserDoc|null> {
  return await this.model.findById(id);
}
 async getAllUsers(page = 1, limit = 10, search = ""): Promise<{
    users: IUserDoc[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    
    const searchQuery = search 
      ? {
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const users = await UserModel
      .find(searchQuery)
      .select('-password') // Exclude password field
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await UserModel.countDocuments(searchQuery);
    const totalPages = Math.ceil(total / limit);

    return {
      users: users as IUserDoc[],
      total,
      page,
      totalPages
    };
  }

  async updateUserBlockStatus(userId: string, isBlocked: boolean): Promise<IUserDoc> {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { isBlocked },
      { new: true }
    ).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    const result = await UserModel.findByIdAndDelete(userId);
    if (!result) {
      throw new Error('User not found');
    }
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    totalDoctors: number;
    blockedUsers: number;
  }> {
    const [totalUsers, totalDoctors, blockedUsers] = await Promise.all([
      UserModel.countDocuments({}),
      UserModel.countDocuments({ isDoctor: true }),
      UserModel.countDocuments({ isDoctor: false, isAdmin: false }),
      UserModel.countDocuments({ isBlocked: true })
    ]);

    return {
      totalUsers,
      totalDoctors, 
      blockedUsers
    };
  }



}
