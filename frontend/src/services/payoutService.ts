import httpClient from "@/services/httpClient";

export const payoutService = {
  requestPayout: async (amount: number) => {
    const { data } = await httpClient.post("/doctor/payout", { amount });
    return data;
  },
  getMyPayoutHistory: async () => {
    const { data } = await httpClient.get("/doctor/payouts");
    return Array.isArray(data) ? data : data?.records ?? [];
  },
};;
