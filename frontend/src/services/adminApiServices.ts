import axios from 'axios';
import type { UserListResponse, UserStats } from '@/types/user';

const API_BASE_URL = 'http://localhost:4000/api';

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ADD for refresh cookie
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error?.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshRes = await axios.post(
          'http://localhost:4000/api/auth/refresh-token',
          {},
          { withCredentials: true } // send cookie
        );
        const newAccess = refreshRes?.data?.accessToken;
        if (newAccess) {
          localStorage.setItem('auth_token', newAccess);
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newAccess}`;
          return adminApi.request(original);
        }
      } catch (e) {
        // Optional: clear and redirect
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    return Promise.reject(error);
  }
);

export const adminService = {
  getUsers: async (page = 1, limit = 10, search = ''): Promise<UserListResponse> => {
    const response = await adminApi.get(`/admin/users`, { params: { page, limit, search } });
    const payload = response.data?.data || response.data;
    return payload;
  },

  blockUser: async (userId: string): Promise<{ message: string }> => {
    const response = await adminApi.post(`/admin/users/${userId}/block`);
    return response.data;
  },

  unblockUser: async (userId: string): Promise<{ message: string }> => {
    const response = await adminApi.post(`/admin/users/${userId}/unblock`);
    return response.data;
  },

  deleteUser: async (userId: string): Promise<{ message: string }> => {
    const response = await adminApi.delete(`/admin/users/${userId}`);
    return response.data;
  },

  getUserStats: async (): Promise<UserStats> => {
    const response = await adminApi.get('/admin/stats');
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
    const res = await adminApi.get('/admin/pet-categories', { params });
    return res.data?.data as { data: AdminPetCategory[]; page: number; totalPages: number; total: number };
  },
  create: async (payload: { name: string; iconKey?: string; description?: string; isActive?: boolean; sortOrder?: number }) => {
    const res = await adminApi.post('/admin/pet-categories', payload);
    return res.data?.data as AdminPetCategory;
  },
  update: async (id: string, payload: Partial<{ name: string; iconKey: string; description: string; isActive: boolean; sortOrder: number }>) => {
    const res = await adminApi.patch(`/admin/pet-categories/${id}`, payload);
    return res.data?.data as AdminPetCategory;
  },
delete: async (id: string) => {
    const res = await adminApi.delete(`/admin/pet-categories/${id}`);
    // Return { success, data } or just true based on your backend; here we return data if provided.
    return res.data?.data ?? res.data ?? { success: true };
  },
}

