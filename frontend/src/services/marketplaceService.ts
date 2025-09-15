// src/services/marketplaceService.ts
import axios from 'axios';
import { API_BASE_URL } from '@/constants/apiRoutes';

const client = axios.create({ baseURL: API_BASE_URL, withCredentials: true });
client.interceptors.request.use((config) => {
  const t = localStorage.getItem('auth_token');
  if (t) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${t}`;
    console.log('Sending token:', t.substring(0, 20) + '...'); // DEBUG
  } else {
    console.log('No token found in localStorage'); // DEBUG
  }
  return config;
});


let isRefreshing = false;
let queue: Array<() => void> = [];

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error?.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        await new Promise<void>((resolve) => queue.push(resolve));
      }

      try {
        isRefreshing = true;
        const refreshRes = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        const newAccess = refreshRes?.data?.accessToken;
        if (newAccess) {
          localStorage.setItem("auth_token", newAccess);
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newAccess}`;
          queue.forEach((fn) => fn());
          queue = [];
          return client.request(original);
        }
      } catch (e) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
export const marketplaceService = {
  create: async (payload: {
    title: string;
    description: string;
    photos: string[];
    price: number | null;
    ageText?: string;
    place: string;
    contact: string;
  }) => {
    const { data } = await client.post('/marketplace/listings', payload);
    return data?.data ?? data;
  },
  list: async (params: { page?: number; limit?: number; type?: 'sell'|'adopt'; q?: string; place?: string }) => {
    const { data } = await client.get('/marketplace/listings', { params });
    return data?.data ?? data;
  },
  mine: async (page = 1, limit = 12) => {
    const { data } = await client.get('/marketplace/listings/mine', { params: { page, limit } });
    return data?.data ?? data;
  },
  update: async (id: string, patch: any) => {
    const { data } = await client.patch(`/marketplace/listings/${id}`, patch);
    return data?.data ?? data;
  },
  changeStatus: async (id: string, status: 'active'|'reserved'|'closed') => {
    const { data } = await client.post(`/marketplace/listings/${id}/status`, { status });
    return data?.data ?? data;
  },
  remove: async (id: string) => {
    const r = await client.delete(`/marketplace/listings/${id}`);
    return r.status === 204;
  },
};
