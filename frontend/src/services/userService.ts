// src/services/userService.ts
import axios from 'axios';
import { API_BASE_URL, AUTH_ROUTES, USER_ROUTES } from '@/constants/apiRoutes';
import type { Role } from '@/types/user';

// 1) Shared axios client with base + credentials + Authorization header + 401 refresh
const client = axios.create({
  baseURL: API_BASE_URL,          // http://localhost:4000/api
  withCredentials: true,          // send cookies (refresh/session)
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let queue: Array<() => void> = [];

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config || {};
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
          localStorage.setItem('auth_token', newAccess);
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newAccess}`;
          queue.forEach((fn) => fn());
          queue = [];
          return client.request(original);
        }
      } catch (e) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// 2) Strongly-typed payloads
export interface SignupPayload {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
}

export interface HandleResendPayload {
  email: string;
}

// 3) Service methods using the configured client
const userService = {
  // Auth flows
  login: (email: string, password: string) =>
    client.post(AUTH_ROUTES.LOGIN.replace(API_BASE_URL, ''), { email, password }),

  signup: (payload: SignupPayload) =>
    client.post(AUTH_ROUTES.SIGNUP.replace(API_BASE_URL, ''), payload),

  logout: () =>
    client.post(AUTH_ROUTES.LOGOUT.replace(API_BASE_URL, ''), {}),

  resendOtp: (email: string) =>
    client.post(AUTH_ROUTES.RESEND_OTP.replace(API_BASE_URL, ''), { email }),

  // Profile
  getProfile: () =>
    client.get(USER_ROUTES.PROFILE.replace(API_BASE_URL, '')),

  updateProfile: (profileData: any) =>
    client.put(USER_ROUTES.UPDATE_PROFILE.replace(API_BASE_URL, ''), profileData),
};

export default userService;
