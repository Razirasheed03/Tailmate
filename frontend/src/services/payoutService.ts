import httpClient from "@/services/httpClient";

// Request a payout (POST /doctor/payout)
export const payoutService = {
  requestPayout: async (amount: number) => {
    const { data } = await httpClient.post("/doctor/payout", { amount });
    return data;
  },
  // Fetch payout history (GET /doctor/payouts)
  listPayouts: async () => {
    const { data } = await httpClient.get("/doctor/payouts");
    return Array.isArray(data) ? data : data?.records ?? [];
  },
};
