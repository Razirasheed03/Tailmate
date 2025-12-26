// src/services/userService.ts
import { AUTH_ROUTES, USER_ROUTES } from "@/constants/apiRoutes";
import type { Role } from "@/types/user";
import httpClient from "./httpClient";
import type { BookingRow, BookingListParams } from "@/types/booking.types";

export interface SignupPayload {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
}

const userService = {
  login: async (email: string, password: string) => {
    const { data } = await httpClient.post(AUTH_ROUTES.LOGIN, { email, password });
    return { success: data?.success, data: data?.data, message: data?.message };
  },

  signup: async (payload: SignupPayload) => {
    const { data } = await httpClient.post(AUTH_ROUTES.SIGNUP, payload);
    return { success: data?.success, data: data?.data, message: data?.message };
  },

  logout: async () => {
    const { data } = await httpClient.post(AUTH_ROUTES.LOGOUT);
    return { success: data?.success, data: data?.data, message: data?.message };
  },

  resendOtp: async (email: string) => {
    const { data } = await httpClient.post(AUTH_ROUTES.RESEND_OTP, { email });
    return { success: data?.success, data: data?.data, message: data?.message };
  },

  getProfile: async () => {
    const { data } = await httpClient.get(USER_ROUTES.PROFILE);
    return { success: data?.success, data: data?.data, message: data?.message };
  },

  updateProfile: async (profileData: any) => {
    const { data } = await httpClient.put(USER_ROUTES.UPDATE_PROFILE, profileData);
    return { success: data?.success, data: data?.data, message: data?.message };
  },

  listBookings: async (params: BookingListParams): Promise<{ data: BookingRow[]; total: number }> => {
    const { data } = await httpClient.get("/bookings", { params });
    return { data: data?.data?.items ?? [], total: data?.data?.total ?? 0 };
  },

  getBooking: async (bookingId: string): Promise<BookingRow | null> => {
    const { data } = await httpClient.get(`/bookings/${bookingId}`);
    return data?.data ?? null;
  },

  cancelBooking: async (bookingId: string) => {
    const { data } = await httpClient.post(`/bookings/${bookingId}/cancel`);
    return { success: data?.success, message: data?.message };
  },

  getWallet: async () => {
    const { data } = await httpClient.get("/wallet");
    return { success: data?.success, data: data?.data };
  },

  getWalletTransactions: async () => {
    const { data } = await httpClient.get("/wallet/transactions");
    return { success: data?.success, data: data?.data };
  },
};

export default userService;
