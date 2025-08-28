import axios from "axios";
const API = "http://localhost:4000/api";

const client = axios.create({ baseURL: API, withCredentials: true });

// attach token if not globally handled
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});
// refresh-on-401 (issue came after some minutes of login (expiring access token ))
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
          `${API}/auth/refresh-token`,
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

// Types
export type DoctorRow = {
  userId: string;            // stringified ObjectId
  username: string;
  email: string;
  status: "pending" | "verified" | "rejected";
  certificateUrl?: string;
  submittedAt?: string;
};

export type DoctorListResponse = {
  data: DoctorRow[];
  page: number;
  totalPages: number;
  total: number;
};

export const adminDoctorService = {
  // why: admins must filter pending/verified/rejected and search
  list: async (params: { page?: number; limit?: number; status?: string; search?: string }) => {
    const { page = 1, limit = 10, status = "", search = "" } = params || {};
    const { data } = await client.get("/admin/doctors", {
      params: { page, limit, status, search },
    });
    // backend should reply with { success, data: { data, page, totalPages, total } }
    return data.data as DoctorListResponse;
  },

  // why: one-click verification
  verify: async (userId: string) => {
    const { data } = await client.post(`/admin/doctors/${userId}/verify`);
    return data?.data;
  },

  // why: record context on rejection
  reject: async (userId: string, reasons: string[]) => {
    const { data } = await client.post(`/admin/doctors/${userId}/reject`, { reasons });
    return data?.data;
  },
};
