// src/services/payoutService.ts
import httpClient from "./httpClient";

type OwnerType = "user" | "doctor";

const payoutService = {
  requestPayout: async (
    ownerType: OwnerType,
    amount: number,
    currency: string = "INR"
  ) => {
    // POST request to backend payout endpoint
    const { data } = await httpClient.post("/payout/request", {
      ownerType,
      amount,
      currency,
    });
    if (!data?.success) throw new Error(data?.message || "Payout request failed");
    return data.data;
  },

  getMyPayoutHistory: async (ownerType: OwnerType) => {
    // GET request to backend payout history endpoint
    const { data } = await httpClient.get("/payout/history", {
      params: { ownerType },
    });
    return data?.data || [];
  },
};

export default payoutService;
