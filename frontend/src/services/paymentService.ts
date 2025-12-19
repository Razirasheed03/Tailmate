// src/services/paymentService.ts
import httpClient from "./httpClient";

import type {  CreatePaymentSessionRes } from "@/types/payment.types";
interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

interface PaymentData {
  _id: string;
  amount: number;
  platformFee: number;
  doctorEarning: number;
  currency: string;
  bookingId: string;
  paymentStatus: "pending" | "success" | "failed";
  createdAt: string;
}

interface PaginatedPaymentsResponse {
  data: PaymentData[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
export const paymentService = {
  async createCheckoutSession(bookingId: string): Promise<CreatePaymentSessionRes> {
    const { data } = await httpClient.post<{ success: boolean; data: CreatePaymentSessionRes }>(
      "/payments/create-checkout-session",
      { bookingId }
    );
    return data.data;
  },

 async listDoctorPayments(params: PaginationParams = {}): Promise<PaginatedPaymentsResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.order) queryParams.append('order', params.order);

  const { data } = await httpClient.get<{ 
    success: boolean; 
    data: PaginatedPaymentsResponse 
  }>(`/payments/doctor?${queryParams.toString()}`);
  
  return data.data;
}
};
