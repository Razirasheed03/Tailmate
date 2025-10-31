// src/services/interfaces/admin.service.interface.ts
import { IUserModel } from "../../models/interfaces/user.model.interface";
import {
  DoctorDetail,
  ListDoctorsResponse,
  DoctorVerification,
} from "../../models/types/doctor.types";

export interface IAdminService {
  // Existing user operations
  getAllUsers(page: number, limit: number, search: string): Promise<{
    users: Omit<IUserModel, "password">[];
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

  // Doctor moderation operations
  listDoctors(
    page?: number,
    limit?: number,
    status?: string,
    search?: string
  ): Promise<ListDoctorsResponse>;

  verifyDoctor(
    userId: string,
    reviewerId: string
  ): Promise<{
    status: "verified";
    verifiedAt: Date | undefined;
  }>;

  getDoctorDetail(userId: string): Promise<DoctorDetail>;

  rejectDoctor(
    userId: string,
    reviewerId: string,
    reasons: string[]
  ): Promise<{
    status: "rejected";
    rejectionReasons: string[];
  }>;

  listPetCategories(
    page: number,
    limit: number,
    search?: string,
    active?: string
  ): Promise<any>;

  createPetCategory(payload: {
    name: string;
    iconKey?: string;
    description?: string;
    isActive?: boolean;
    sortOrder?: number;
  }): Promise<any>;

  updatePetCategory(
    id: string,
    payload: Partial<{
      name: string;
      iconKey: string;
      description: string;
      isActive: boolean;
      sortOrder: number;
    }>
  ): Promise<any>;
  deletePetCategory(id: string): Promise<boolean>;
}