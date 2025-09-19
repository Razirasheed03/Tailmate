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

export interface HandleResendPayload {
  email: string;
}

// 3) Service methods using the configured client
const userService = {
  // Auth flows
  login: (email: string, password: string) =>
    httpClient.post(AUTH_ROUTES.LOGIN.replace(API_BASE_URL, ''), { email, password }),

  signup: (payload: SignupPayload) =>
    httpClient.post(AUTH_ROUTES.SIGNUP.replace(API_BASE_URL, ''), payload),

  logout: () =>
    httpClient.post(AUTH_ROUTES.LOGOUT.replace(API_BASE_URL, ''), {}),

  resendOtp: (email: string) =>
    httpClient.post(AUTH_ROUTES.RESEND_OTP.replace(API_BASE_URL, ''), { email }),

  // Profile
  getProfile: () =>
    httpClient.get(USER_ROUTES.PROFILE.replace(API_BASE_URL, '')),

  updateProfile: (profileData: any) =>
    httpClient.put(USER_ROUTES.UPDATE_PROFILE.replace(API_BASE_URL, ''), profileData),
};

export default userService;
