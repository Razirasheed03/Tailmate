import httpClient from "./httpClient";

export type VerificationStatus = "pending" | "verified" | "rejected";

export type DoctorRow = {
  userId: string;          
  username: string;
  email: string;
  status:VerificationStatus;
  certificateUrl?: string;
  submittedAt?: string;
};

export type DoctorListResponse = {
  data: DoctorRow[];
  page: number;
  totalPages: number;
  total: number;
};

export type DoctorDetail = {
  userId: string;
  username: string;
  email: string;
  status: VerificationStatus;
  // verification
  certificateUrl?: string;
  submittedAt?: string;
  verifiedAt?: string;
  rejectionReasons?: string[];
  // profile
  displayName?: string;
  bio?: string;
  specialties?: string[];
  experienceYears?: number;
  licenseNumber?: string;
  avatarUrl?: string;
  consultationFee?: number;
};



export const adminDoctorService = {
  list: async (params: { page?: number; limit?: number; status?: string; search?: string }) => {
    const { page = 1, limit = 10, status = "", search = "" } = params || {};
    const { data } = await httpClient.get("/admin/doctors", {
      params: { page, limit, status, search },
    });
    return data.data as DoctorListResponse;
  },


  verify: async (userId: string) => {
    const { data } = await httpClient.post(`/admin/doctors/${userId}/verify`);
    return data?.data;
  },

  reject: async (userId: string, reasons: string[]) => {
    const { data } = await httpClient.post(`/admin/doctors/${userId}/reject`, { reasons });
    return data?.data;
  },
   getDetail: async (userId: string): Promise<DoctorDetail> => {
    const { data } = await httpClient.get<{ success: boolean; data: DoctorDetail }>(`/admin/doctors/${userId}`);
    return data.data;
  },
};
