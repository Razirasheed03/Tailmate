// src/mappers/admin/user.mapper.ts
import { IUserModel } from "../../models/interfaces/user.model.interface";
import {
  UserListItemDTO,
  UserListResponseDTO,
  UserStatsDTO,
} from "../../dtos/admin/user.dto";

export class UserMapper {
  static toUserListItemDTO(user: IUserModel): UserListItemDTO {
    return {
      id: user._id?.toString() || "",
      username: user.username || "",
      email: user.email || "",
      role: user.role || "",
      isBlocked: user.isBlocked || false,
      createdAt: user.createdAt || new Date(),
    };
  }

  static toUserListResponseDTO(
    users: Omit<IUserModel, "password">[],
    total: number,
    page: number,
    totalPages: number
  ): UserListResponseDTO {
    return {
      users: users.map((user) => this.toUserListItemDTO(user as IUserModel)),
      total,
      page,
      totalPages,
    };
  }

  static toUserStatsDTO(stats: {
    totalUsers: number;
    totalDoctors: number;
    blockedUsers: number;
  }): UserStatsDTO {
    return {
      totalUsers: stats.totalUsers,
      totalDoctors: stats.totalDoctors,
      blockedUsers: stats.blockedUsers,
    };
  }
}
