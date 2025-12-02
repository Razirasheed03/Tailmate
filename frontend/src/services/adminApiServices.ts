// src/services/adminApiServices.ts
import httpClient from "./httpClient";
import type { UserListResponse, UserStats } from "@/types/user";
import type {
  AdminPetCategory,
  AdminCategoryListResponse,
} from "../types/adminCategory.types";

export const adminService = {
  getUsers: async (
    page = 1,
    limit = 10,
    search = ""
  ): Promise<UserListResponse> => {
    const response = await httpClient.get(`/admin/users`, {
      params: { page, limit, search },
    });
    const payload = response.data?.data || response.data;
    return payload as UserListResponse;
  },

  blockUser: async (userId: string): Promise<{ message: string }> => {
    const response = await httpClient.post(`/admin/users/${userId}/block`);
    return response.data as { message: string };
  },

  unblockUser: async (userId: string): Promise<{ message: string }> => {
    const response = await httpClient.post(`/admin/users/${userId}/unblock`);
    return response.data as { message: string };
  },

  deleteUser: async (userId: string): Promise<{ message: string }> => {
    const response = await httpClient.delete(`/admin/users/${userId}`);
    return response.data as { message: string };
  },

  getUserStats: async (): Promise<UserStats> => {
    const response = await httpClient.get("/admin/stats");
    const payload = response.data?.data || response.data;
    return payload as UserStats;
  },
  getWalletEarnings: async () => {
    const { data } = await httpClient.get("/admin/wallet/earnings"); // Adjust path to match backend
    return data?.data || [];
  },
    getDashboardStats: async () => {
    const { data } = await httpClient.get("/admin/dashboard-stats");
    if (data.success) return data.data;
    throw new Error("Failed to fetch admin dashboard stats");
  },
  getIncomeByMonth: async () => {
  const { data } = await httpClient.get("/admin/income-by-month");
  if (data.success) return data.data;
  throw new Error("Failed to fetch monthly income");
},
getStatusChart:async() =>{
  const res = await httpClient.get("/admin/dashboard/status-chart");
  return res.data.data;
},
getDoctorList: async () => {
  const res = await httpClient.get("/admin/simple-doctors");
  return res.data.data;
}
,



getFilteredEarnings: async (start?: string, end?: string, doctorId?: string) => {
  const params: any = {};
  if (start) params.start = start;
  if (end) params.end = end;
  if (doctorId) params.doctorId = doctorId;

  const response = await httpClient.get("/admin/earnings/filter", { params });
  return response.data.data;
},




};

export const adminCategoryService = {
  list: async (
    page = 1,
    limit = 10,
    search = "",
    active?: boolean
  ): Promise<AdminCategoryListResponse> => {
    const params: any = { page, limit, search };
    if (typeof active === "boolean") params.active = String(active);
    const res = await httpClient.get("/admin/pet-categories", { params });
    return res.data?.data as AdminCategoryListResponse;
  },

  create: async (payload: {
    name: string;
    iconKey?: string;
    description?: string;
    isActive?: boolean;
    sortOrder?: number;
  }): Promise<AdminPetCategory> => {
    const res = await httpClient.post("/admin/pet-categories", payload);
    return res.data?.data as AdminPetCategory;
  },

  update: async (
    id: string,
    payload: Partial<{
      name: string;
      iconKey: string;
      description: string;
      isActive: boolean;
      sortOrder: number;
    }>
  ): Promise<AdminPetCategory> => {
    const res = await httpClient.patch(`/admin/pet-categories/${id}`, payload);
    return res.data?.data as AdminPetCategory;
  },

  delete: async (id: string): Promise<unknown> => {
    const res = await httpClient.delete(`/admin/pet-categories/${id}`);
    return res.data?.data ?? res.data ?? { success: true };
  },
};
