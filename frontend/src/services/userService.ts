// src/services/userService.ts
import { API_BASE_URL, AUTH_ROUTES, USER_ROUTES } from '@/constants/apiRoutes';
import type { Role } from '@/types/user';
import httpClient from './httpClient';

export interface SignupPayload {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
}

const userService = {
  // Auth flows (return normalized { success, data?, message? })
  login: async (email: string, password: string) => {
    const { data } = await httpClient.post(AUTH_ROUTES.LOGIN.replace(API_BASE_URL, ''), { email, password });
    // Expect { success, data: { accessToken, user } }
    return { success: data?.success, data: data?.data, message: data?.message };
  },

  signup: async (payload: SignupPayload) => {
    const { data } = await httpClient.post(AUTH_ROUTES.SIGNUP.replace(API_BASE_URL, ''), payload);
    // Expect { success, data: ..., message }
    return { success: data?.success, data: data?.data, message: data?.message };
  },

  logout: async () => {
    const { data } = await httpClient.post(AUTH_ROUTES.LOGOUT.replace(API_BASE_URL, ''), {});
    return { success: data?.success, data: data?.data, message: data?.message };
  },

  resendOtp: async (email: string) => {
    const { data } = await httpClient.post(AUTH_ROUTES.RESEND_OTP.replace(API_BASE_URL, ''), { email });
    // Expect { success, data: { ok: true }, message: "OTP resent!" }
    return { success: data?.success, data: data?.data, message: data?.message };
  },

  // Profile
  getProfile: async () => {
    const { data } = await httpClient.get(USER_ROUTES.PROFILE.replace(API_BASE_URL, ''));
    return { success: data?.success, data: data?.data, message: data?.message };
  },

  updateProfile: async (profileData: any) => {
    const { data } = await httpClient.put(USER_ROUTES.UPDATE_PROFILE.replace(API_BASE_URL, ''), profileData);
    return { success: data?.success, data: data?.data, message: data?.message };
  },
};

export default userService;
