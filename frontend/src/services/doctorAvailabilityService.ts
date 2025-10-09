// src/services/doctorAvailabilityService.ts
import httpClient from "./httpClient";

<<<<<<< HEAD
export type UIMode = "video" | "audio" | "inPerson";
export type UISlot = {
  id: string;
  date: string;         // YYYY-MM-DD
  time: string;         // HH:mm
  durationMins: number; // 15..120
  fee: number;          // currency integer
  modes: UIMode[];
  status: "available" | "booked";
};

type ApiResponse<T> = { success: boolean; data: T; message?: string };

type ApiSlot = {
  _id: string;
  userId?: string;
  date: string;
  time: string;
  durationMins: number;
  fee: number;
  modes: UIMode[] | string[];
  status: "available" | "booked";
};

const normalize = (s: ApiSlot): UISlot => ({
  id: s._id,
  date: s.date,
  time: s.time,
  durationMins: s.durationMins,
  fee: s.fee ?? 0,
  // Coerce any string[] into the UIMode union safely
  modes: (s.modes as string[])
    .map((m) => (m === "video" || m === "audio" || m === "inPerson" ? m : "video")) as UIMode[],
  status: s.status,
});

export const doctorAvailabilityService = {

  async getDaySlots(date: string): Promise<UISlot[]> {
    const { data } = await httpClient.get<ApiResponse<ApiSlot[]>>(
      "/doctor/availability/slots",
      { params: { date } }
    );
    const list = Array.isArray(data?.data) ? data.data : [];
    return list.map(normalize);
  },

  async saveDaySchedule(payload: { date: string; slots: UISlot[] }): Promise<UISlot[]> {
    const body = {
      date: payload.date,
      // Backend expects minimal slot fields without id
      slots: payload.slots.map((s) => ({
        time: s.time,
        durationMins: s.durationMins,
        fee: s.fee,
        modes: s.modes,
        status: s.status,
      })),
    };
    const { data } = await httpClient.post<ApiResponse<ApiSlot[]>>(
      "/doctor/availability/save-day",
      body
    );
    const list = Array.isArray(data?.data) ? data.data : [];
    return list.map(normalize);
  },

  async createSlot(slot: Omit<UISlot, "id">): Promise<UISlot> {
    const body = {
      date: slot.date,
      time: slot.time,
      durationMins: slot.durationMins,
      fee: slot.fee,
      modes: slot.modes,
      status: slot.status,
    };
    const { data } = await httpClient.post<ApiResponse<ApiSlot>>(
      "/doctor/availability/slots",
      body
    );
    return normalize(data.data as ApiSlot);
  },

  async updateSlotStatus(id: string, status: UISlot["status"]): Promise<UISlot> {
    const { data } = await httpClient.patch<ApiResponse<ApiSlot>>(
      `/doctor/availability/slots/${id}/status`,
      { status }
    );
    return normalize(data.data as ApiSlot);
  },


  async deleteSlot(id: string): Promise<boolean> {
    const { data } = await httpClient.delete<ApiResponse<{ deleted?: boolean }>>(
      `/doctor/availability/slots/${id}`
    );
    return !!(data?.data && (data.data as any).deleted);
=======
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
>>>>>>> 11d8dc8a5384d5aacc779829f1d95fc01664fc08
  },
};
