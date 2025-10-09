// src/services/paymentService.ts
import httpClient from "./httpClient";

export type CreatePaymentSessionReq = { bookingId: string };
export type CreatePaymentSessionRes = { url: string };

export const paymentService = {
  async createCheckoutSession(bookingId: string): Promise<CreatePaymentSessionRes> {
    const { data } = await httpClient.post<{ success: boolean; data: CreatePaymentSessionRes }>(
      "/payments/create-checkout-session",
      { bookingId }
    );
    return data.data;
  },

  async listDoctorPayments(): Promise<Array<{
    _id: string;
    amount: number;
    platformFee: number;
    doctorEarning: number;
    currency: string;
    bookingId: string;
    paymentStatus: "pending" | "success" | "failed";
    createdAt: string;
  }>> {
    const { data } = await httpClient.get<{ success: boolean; data: any[] }>("/payments/doctor");
    return data.data || [];
  },
};
