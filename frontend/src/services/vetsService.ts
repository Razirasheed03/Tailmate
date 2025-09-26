// src/services/vetsService.ts
import httpClient from "./httpClient";

export type UIMode = "video" | "audio" | "inPerson";

export type DoctorCard = {
  doctorId: string;
  displayName: string;
  avatarUrl?: string;
  experienceYears?: number;
  specialties?: string[];
  consultationFee?: number;
  isOnline?: boolean;
  nextSlot?: { date: string; time: string };
  modes?: UIMode[];
};

export type DoctorDetail = {
  doctorId: string;
  displayName: string;
  avatarUrl?: string;
  experienceYears?: number;
  specialties?: string[];
  consultationFee?: number;
  bio?: string;
  languages?: string[];
  location?: string;
  modes?: UIMode[];
};

export type VetSlot = {
  _id: string;
  date: string;
  time: string;
  durationMins: number;
  fee: number;
  modes: UIMode[] | string[];
  status: "available" | "booked";
};

const normalizeSlot = (s: VetSlot) => ({
  id: s._id,
  date: s.date,
  time: s.time,
  durationMins: s.durationMins,
  fee: s.fee ?? 0,
  modes: (s.modes as string[]).map((m) => (m === "video" || m === "audio" || m === "inPerson" ? m : "video")) as UIMode[],
  status: s.status,
});
type ApiResponse<T> = { success: boolean; data: T; message?: string };
const safeId = (v: string) => encodeURIComponent(v || "");
export const vetsService = {
  async listDoctors(params: {
    page?: number;
    limit?: number;
    search?: string;
    specialty?: string;
  }): Promise<{ data: DoctorCard[]; total: number }> {
    // CHANGED: from "/public/doctors" to "/vets"
    const { data } = await httpClient.get<ApiResponse<{ items: DoctorCard[]; total: number }>>(
      "/vets",
      { params }
    );
    const payload = data?.data || { items: [], total: 0 };
    return { data: payload.items, total: payload.total };
  },
 async getDoctor(doctorId: string): Promise<DoctorDetail> {
    if (!doctorId) throw new Error("doctorId is required");
    const { data } = await httpClient.get<{ success: boolean; data: DoctorDetail }>(
      `/vets/${safeId(doctorId)}`
    );
    return data.data;
  },

  async getDoctorSlots(
    doctorId: string,
    params: { from: string; to: string; status?: "available" | "booked" }
  ): Promise<ReturnType<typeof normalizeSlot>[]> {
    const { data } = await httpClient.get<{ success: boolean; data: VetSlot[] }>(
     `/vets/${safeId(doctorId)}/slots`,
      { params } // e.g., { from: '2025-09-25', to: '2025-10-01', status: 'available' }
    );
    return (data?.data || []).map(normalizeSlot);
  },
};
