import type { UserListResponse, UserStats } from '@/types/user';
import httpClient from './httpClient';

export const adminService = {
  getUsers: async (page = 1, limit = 10, search = ''): Promise<UserListResponse> => {
    const response = await httpClient.get(`/admin/users`, { params: { page, limit, search } });
    const payload = response.data?.data || response.data;
    return payload;
  },

  blockUser: async (userId: string): Promise<{ message: string }> => {
    const response = await httpClient.post(`/admin/users/${userId}/block`);
    return response.data;
  },

  unblockUser: async (userId: string): Promise<{ message: string }> => {
    const response = await httpClient.post(`/admin/users/${userId}/unblock`);
    return response.data;
  },

  deleteUser: async (userId: string): Promise<{ message: string }> => {
    const response = await httpClient.delete(`/admin/users/${userId}`);
    return response.data;
  },

  getUserStats: async (): Promise<UserStats> => {
    const response = await httpClient.get('/admin/stats');
    const payload = response.data?.data || response.data;
    return payload;
  },
};
export type AdminPetCategory = {
  _id: string;
  name: string;
  description?: string;
  iconKey?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export const adminCategoryService = {
  list: async (page = 1, limit = 10, search = '', active?: boolean) => {
    const params: any = { page, limit, search };
    if (typeof active === 'boolean') params.active = String(active);
    const res = await httpClient.get('/admin/pet-categories', { params });
    return res.data?.data as { data: AdminPetCategory[]; page: number; totalPages: number; total: number };
  },
  create: async (payload: { name: string; iconKey?: string; description?: string; isActive?: boolean; sortOrder?: number }) => {
    const res = await httpClient.post('/admin/pet-categories', payload);
    return res.data?.data as AdminPetCategory;
  },
  update: async (id: string, payload: Partial<{ name: string; iconKey: string; description: string; isActive: boolean; sortOrder: number }>) => {
    const res = await httpClient.patch(`/admin/pet-categories/${id}`, payload);
    return res.data?.data as AdminPetCategory;
  },
  delete: async (id: string) => {
    const res = await httpClient.delete(`/admin/pet-categories/${id}`);
    // Return { success, data } or just true based on your backend; here we return data if provided.
    return res.data?.data ?? res.data ?? { success: true };
  },
}

