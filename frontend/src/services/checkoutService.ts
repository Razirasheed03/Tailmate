// src/services/checkoutService.ts
import httpClient from "./httpClient";

export type PaymentMethod = "upi" | "card" | "netbanking" | "wallet";

export type GetQuotePayload = {
  doctorId: string;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:mm
  durationMins: number;
  mode: "video" | "audio" | "inPerson";
  baseFee: number;
};

export type QuoteResponse = {
  amount: number;        // base amount
  tax?: number;
  discount?: number;
  totalAmount: number;
  currency: string;      // e.g., "INR"
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
  redirectUrl?: string; // e.g., payment gateway page
};

export const checkoutService = {
  async getQuote(payload: GetQuotePayload): Promise<QuoteResponse> {
    // Backend to implement: POST /checkout/quote
    // Axios automatically JSON-serializes objects and sets application/json. 
    const { data } = await httpClient.post<{ success: boolean; data: QuoteResponse }>(
      "/checkout/quote",
      payload
    );
    return data.data;
  },

  async createCheckout(payload: CreateCheckoutPayload): Promise<CreateCheckoutResponse> {
    // Backend to implement: POST /checkout/create
    const { data } = await httpClient.post<{ success: boolean; data: CreateCheckoutResponse }>(
      "/checkout/create",
      payload
    );
    return data.data;
  },
};
