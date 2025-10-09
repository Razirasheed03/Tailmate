// src/services/doctorAvailabilityService.ts
import httpClient from "./httpClient";

export const doctorAvailabilityService = {
  async getWeeklyRules() {
    const { data } = await httpClient.get("/doctor/schedule/rules");
    return data?.data || [];
  },
  async saveWeeklyRules(rules: any[]) {
    const { data } = await httpClient.post("/doctor/schedule/rules", { rules });
    return data?.data || [];
  },
  async getGeneratedAvailability(from: string, to: string, rules?: any[]) {
    const { data } = await httpClient.post("/doctor/schedule/availability", { rules }, { params: { from, to } });
    return data?.data || {};
  },
};
