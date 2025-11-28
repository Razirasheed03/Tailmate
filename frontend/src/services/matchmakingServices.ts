import httpClient from './httpClient';
import type { AxiosResponse } from 'axios';
import type { PaginatedResponse, ApiResponse } from '@/types/marketplace.types';

export const matchmakingService = {
  create: async (data: any): Promise<any> => {
    const res: AxiosResponse<ApiResponse<any>> = await httpClient.post('/matchmaking', data);
    return res.data?.data ?? res.data;
  },

  listPublic: async (params: any): Promise<PaginatedResponse<any>> => {
    const res: AxiosResponse<ApiResponse<PaginatedResponse<any>>> = await httpClient.get(
      '/matchmaking/list',
      { params }
    );

    const r = res.data?.data ?? res.data;
    return {
      data: r.data || [],
      page: r.page || 1,
      total: r.total || 0,
      totalPages: r.totalPages || 1,
    };
  },

  listMine: async (page = 1, limit = 12): Promise<PaginatedResponse<any>> => {
    const res: AxiosResponse<ApiResponse<PaginatedResponse<any>>> = await httpClient.get(
      '/matchmaking/mine',
      { params: { page, limit } }
    );

    const r = res.data?.data ?? res.data;
    return {
      data: r.data || [],
      page: r.page || 1,
      total: r.total || 0,
      totalPages: r.totalPages || 1,
    };
  },

  update: async (id: string, patch: any): Promise<any> => {
    const res: AxiosResponse<ApiResponse<any>> = await httpClient.put(`/matchmaking/${id}`, patch);
    return res.data?.data ?? res.data;
  },

  changeStatus: async (id: string, status: 'active' | 'matched' | 'closed'): Promise<any> => {
    const res: AxiosResponse<ApiResponse<any>> = await httpClient.patch(
      `/matchmaking/${id}/status`,
      { status }
    );
    return res.data?.data ?? res.data;
  },

  delete: async (id: string): Promise<boolean> => {
    const res = await httpClient.delete(`/matchmaking/${id}`);
    return res.status === 204 || res.status === 200;
  },

  uploadPhoto: async (file: File): Promise<{ url: string }> => {
    const form = new FormData();
    form.append('file', file);
    const res = await httpClient.post('/matchmaking/photo', form);
    return res.data;
  },
};
