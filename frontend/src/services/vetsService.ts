// src/services/vetsService.ts
import httpClient from "./httpClient";
import type { UIMode, DoctorCard, DoctorDetailPublic, VetSlot } from "@/types/doctor.types";

const asUIMode = (m: string): UIMode => (m === "video" || m === "audio" || m === "inPerson" ? m : "video");
const normalizeSlot = (s: VetSlot) => ({
  id: s._id,
  date: s.date,
  time: s.time,
  durationMins: s.durationMins,
  fee: s.fee ?? 0,
  modes: (s.modes as string[]).map(asUIMode) as UIMode[],
  status: s.status,
});
type ApiResponse<T> = { success: boolean; data: T; message?: string };
const safeId = (v: string) => encodeURIComponent(v || "");

export const vetsService = {
  async listDoctors(params: { page?: number; limit?: number; search?: string; specialty?: string; }): Promise<{ data: DoctorCard[]; total: number }> {
    const { data } = await httpClient.get<ApiResponse<{ items: DoctorCard[]; total: number }>>("/vets", { params });
    const payload = data?.data || { items: [], total: 0 };
    return { data: payload.items, total: payload.total };
  },

  async getDoctor(doctorId: string): Promise<DoctorDetailPublic> {
    if (!doctorId) throw new Error("doctorId is required");
    const { data } = await httpClient.get<{ success: boolean; data: DoctorDetailPublic }>(`/vets/${safeId(doctorId)}`);
    return data.data;
  },

  async getDoctorSlots(doctorId: string, params: { from: string; to: string; status?: "available" | "booked" }): Promise<ReturnType<typeof normalizeSlot>[]> {
    const { data } = await httpClient.get<{ success: boolean; data: VetSlot[] }>(`/vets/${safeId(doctorId)}/slots`, { params });
    return (data?.data || []).map(normalizeSlot);
  },
};
