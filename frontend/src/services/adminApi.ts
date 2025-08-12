import axios from 'axios';
import type { User, UserListResponse, UserStats } from '@/types/user';

const API_BASE_URL = 'http://localhost:4000/api';
//////creating a base url for all admin side (ellathinum)
const adminApi = axios.create({
  baseURL: API_BASE_URL,
});
////setting token to admin routes
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminService = {

  getUsers: async (page = 1, limit = 10, search = ''): Promise<UserListResponse> => {
    const response = await adminApi.get(`/admin/users`, {
      params: { page, limit, search }
    });
    return response.data.data;
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
    return response.data.data;
  }
};
