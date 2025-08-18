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
