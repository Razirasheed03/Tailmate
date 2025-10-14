// src/services/checkoutService.ts
import httpClient from "./httpClient";
import type {
  GetQuotePayload,
  QuoteResponse,
  CreateCheckoutPayload,
  CreateCheckoutResponse,
  MockPayResponse,
} from "@/types/checkout.types";

export const checkoutService = {
  async getQuote(payload: GetQuotePayload): Promise<QuoteResponse> {
    const { data } = await httpClient.post<{
      success: boolean;
      data: QuoteResponse;
    }>("/checkout/quote", payload);
    return data.data;
  },

  async createCheckout(
    payload: CreateCheckoutPayload
  ): Promise<CreateCheckoutResponse> {
    const { data } = await httpClient.post<{
      success: boolean;
      data: CreateCheckoutResponse;
    }>("/checkout/create", payload);
    return data.data;
  },

  async mockPay(bookingId: string): Promise<MockPayResponse> {
    const { data } = await httpClient.post<{
      success: boolean;
      data: MockPayResponse;
    }>("/checkout/mock-pay", { bookingId });
    return data.data;
  },
};
