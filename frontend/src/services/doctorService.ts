// src/services/doctorService.ts
import httpClient from "./httpClient";


export type UIMode = "video" | "audio" | "inPerson"; 
export type BookingStatus = "pending" | "paid" | "cancelled" | "failed" | "refunded"; 


export type SessionRow = {
  _id: string;
  date: string;           // YYYY-MM-DD
  time: string;           // HH:mm
  durationMins: number;   // minutes
  mode: UIMode;
  status: BookingStatus;
  petName: string;
  notes?: string;
  patientId: string;
  patientName?: string;
  patientEmail?: string;
}; 


export type SessionDetail = SessionRow & {
  doctorId: string;
  slotId?: string | null;
  amount: number;
  currency: string;
  createdAt?: string;
};


export const doctorService = {
  uploadCertificate: async (file: File) => {
    const form = new FormData();
    form.append("certificate", file);
    const { data } = await httpClient.post("/doctor/verification/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data as {
      certificateUrl: string;
      verification: { status: "pending" | "verified" | "rejected"; rejectionReasons?: string[] };
    };
  },
  

  getVerification: async () => {
    const { data } = await httpClient.get("/doctor/verification");
    return data.data as {
      status: "pending" | "verified" | "rejected";
      certificateUrl?: string;
      rejectionReasons?: string[];
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
      consultationFee?: number;
    };
  },

  updateProfile: async (payload: {
    displayName?: string;
    bio?: string;
    specialties?: string[];
    experienceYears?: number;
    licenseNumber?: string;
    avatarUrl?: string;
    consultationFee?: number;
  }) => {
    const { data } = await httpClient.put("/doctor/profile", payload);
    return data.data as {
      displayName?: string;
      bio?: string;
      specialties?: string[];
      experienceYears?: number;
      licenseNumber?: string;
      avatarUrl?: string;
      consultationFee?: number;
    };
  },

  uploadAvatar: async (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    const { data } = await httpClient.post("/doctor/profile/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return (data?.data?.avatarUrl as string) || "";
  },


  async listSessions(params: {
    page?: number;
    limit?: number;
    scope?: "upcoming" | "today" | "past";
    q?: string;
    mode?: UIMode;
  }): Promise<{ data: SessionRow[]; total: number }> {
    const { data } = await httpClient.get<{ success: boolean; data: { items: SessionRow[]; total: number } }>(
      "/doctor/sessions",
      { params }
    );
    const payload = data?.data || { items: [], total: 0 };
    return { data: payload.items, total: payload.total };
  },


  async getSession(id: string): Promise<SessionDetail> {
    const { data } = await httpClient.get<{ success: boolean; data: SessionDetail }>(`/doctor/sessions/${id}`);
    return data.data;
  },
   async getMyUserId(): Promise<{ userId: string }> {
    const { data } = await httpClient.get<{ success: boolean; data: { userId: string } }>("/doctor/me-user-id");
    return data.data;
  },
};

export const doctorIdService = {
  async getMyId(): Promise<{ _id: string }> {
    const { data } = await httpClient.get<{ success: boolean; data: { _id: string } }>(
      "/doctor/me-id"
    );
    return data.data;
  },
};


