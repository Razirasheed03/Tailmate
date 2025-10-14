// src/services/adminDoctorService.ts
import httpClient from "./httpClient";
import type {
  DoctorListResponse,
  DoctorDetail,
} from "@/types/adminDoctor.types";

export const adminDoctorService = {
  list: async (params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<DoctorListResponse> => {
    const { page = 1, limit = 10, status = "", search = "" } = params || {};
    const { data } = await httpClient.get("/admin/doctors", {
      params: { page, limit, status, search },
    });
    return data.data as DoctorListResponse;
  },

  verify: async (userId: string): Promise<any> => {
    const { data } = await httpClient.post(`/admin/doctors/${userId}/verify`);
    return data?.data;
  },

  reject: async (userId: string, reasons: string[]): Promise<any> => {
    const { data } = await httpClient.post(`/admin/doctors/${userId}/reject`, {
      reasons,
    });
    return data?.data;
  },

  getDetail: async (userId: string): Promise<DoctorDetail> => {
    const { data } = await httpClient.get<{
      success: boolean;
      data: DoctorDetail;
    }>(`/admin/doctors/${userId}`);
    return data.data;
  },
};
