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

type ApiResponse<T> = { success: boolean; data: T; message?: string };

export const vetsService = {
  async listDoctors(params: {
    page?: number;
    limit?: number;
    search?: string;
    specialty?: string;
  }): Promise<{ data: DoctorCard[]; total: number }> {
    const { data } = await httpClient.get<ApiResponse<{ items: DoctorCard[]; total: number }>>(
      "/public/doctors",
      { params }
    );
    const payload = data?.data || { items: [], total: 0 };
    return { data: payload.items, total: payload.total };
  },
};
