// src/services/checkoutService.ts
import httpClient from "./httpClient";

export type PaymentMethod = "upi" | "card" | "netbanking" | "wallet";

export type GetQuotePayload = {
  doctorId: string;
  date: string;
  time: string;
  durationMins: number;
  mode: "video" | "audio" | "inPerson";
  baseFee: number;
};

export type QuoteResponse = {
  amount: number;
  tax?: number;
  discount?: number;
  totalAmount: number;
  currency: string;
};

export type CreateCheckoutPayload = {
  doctorId: string;
  date: string;
  time: string;
  durationMins: number;
  mode: "video" | "audio" | "inPerson";
  amount: number;
  currency: string;
  petName: string;
  notes?: string;
  paymentMethod: PaymentMethod;
};

export type CreateCheckoutResponse = {
  bookingId?: string;
  redirectUrl?: string;
};

export type MockPayResponse = {
  bookingId: string;
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
};

export const checkoutService = {
  async getQuote(payload: GetQuotePayload): Promise<QuoteResponse> {
    const { data } = await httpClient.post<{ success: boolean; data: QuoteResponse }>(
      "/checkout/quote",
      payload
    );
    return data.data;
  },

  async createCheckout(payload: CreateCheckoutPayload): Promise<CreateCheckoutResponse> {
    const { data } = await httpClient.post<{ success: boolean; data: CreateCheckoutResponse }>(
      "/checkout/create",
      payload
    );
    return data.data;
  },

  async mockPay(bookingId: string): Promise<MockPayResponse> {
    const { data } = await httpClient.post<{ success: boolean; data: MockPayResponse }>(
      "/checkout/mock-pay",
      { bookingId }
    );
    return data.data;
  },
};
