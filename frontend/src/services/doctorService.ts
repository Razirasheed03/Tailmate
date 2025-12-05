// src/services/doctorService.ts
import httpClient from "./httpClient";
import type { UIMode, SessionRow, SessionDetail } from "@/types/doctor.types";

export const doctorService = {
  // Upload certificate as DRAFT (doesn't submit for review)
  uploadCertificate: async (file: File) => {
    const form = new FormData();
    form.append("certificate", file);
    const { data } = await httpClient.post("/doctor/verification/upload", form, { 
      headers: { "Content-Type": "multipart/form-data" } 
    });
    return data.data as { 
      certificateUrl: string; 
      verification: { 
        status: "pending" | "verified" | "rejected"; 
        rejectionReasons?: string[] 
      } 
    };
  },
  submitForReview: async () => {
    const { data } = await httpClient.post("/doctor/submit-review");
    return data.data;
  },

  getVerification: async () => {
    const { data } = await httpClient.get("/doctor/verification");
    return data.data as { 
      status: "pending" | "verified" | "rejected"; 
      certificateUrl?: string; 
      rejectionReasons?: string[];
      profile?: any;
      profileComplete?: boolean;
    };
  },

  getProfile: async () => {
    const { data } = await httpClient.get("/doctor/profile");
    return data.data as { 
      displayName?: string; 
      bio?: string; 
      specialties?: string[]; 
      experienceYears?: number; 
      licenseNumber?: string; 
      avatarUrl?: string; 
      consultationFee?: number 
    };
  },

  updateProfile: async (payload: { 
    displayName?: string; 
    bio?: string; 
    specialties?: string[]; 
    experienceYears?: number; 
    licenseNumber?: string; 
    avatarUrl?: string; 
    consultationFee?: number 
  }) => {
    const { data } = await httpClient.put("/doctor/profile", payload);
    return data.data;
  },

  uploadAvatar: async (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    const { data } = await httpClient.post("/doctor/profile/avatar", form, { 
      headers: { "Content-Type": "multipart/form-data" } 
    });
    return (data?.data?.avatarUrl as string) || "";
  },

  async listSessions(params: { 
    page?: number; 
    limit?: number; 
    scope?: "upcoming" | "today" | "past"; 
    q?: string; 
    mode?: UIMode 
  }): Promise<{ data: SessionRow[]; total: number }> {
    const { data } = await httpClient.get<{ 
      success: boolean; 
      data: { items: SessionRow[]; total: number } 
    }>("/doctor/sessions", { params });
    const payload = data?.data || { items: [], total: 0 };
    return { data: payload.items, total: payload.total };
  },

  async getSession(id: string): Promise<SessionDetail> {
    const { data } = await httpClient.get<{ 
      success: boolean; 
      data: SessionDetail 
    }>(`/doctor/sessions/${id}`);
    return data.data;
  },

  async getMyUserId(): Promise<{ userId: string }> {
    const { data } = await httpClient.get<{ 
      success: boolean; 
      data: { userId: string } 
    }>("/doctor/me-user-id");
    return data.data;
  },
  startStripeOnboarding: async () => {
    const { data } = await httpClient.post("/doctor/stripe-onboarding");
    return data; // { url, alreadyConnected }
  },
    getDoctorDashboard: async () => {
    const { data } = await httpClient.get("/doctor/doctorDashboard");
    if (data.success) return data.data;
    throw new Error(data.message || "Failed to get doctor dashboard");
  },
 
};

export const doctorIdService = {
  async getMyId(): Promise<{ _id: string }> {
    const { data } = await httpClient.get<{ 
      success: boolean; 
      data: { _id: string } 
    }>("/doctor/me-id");
    return data.data;
  },
  
};