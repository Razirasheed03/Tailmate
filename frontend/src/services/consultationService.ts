//services/consultationService.ts
import httpClient from './httpClient';
import type { AxiosResponse } from 'axios';
import type { ApiResponse } from '@/types/marketplace.types';

export interface Consultation {
  _id: string;
  userId: { _id: string; name: string; email: string; phone: string };
  doctorId: {
    _id: string;
    name: string;
    email: string;
    specialization: string;
    userId?: string | { _id: string };
  };
  scheduledFor: string;
  durationMinutes: number;
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  videoRoomId: string | null;
  callStartedAt: string | null;
  callEndedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const consultationService = {
  createConsultation: async (
    doctorId: string,
    scheduledFor: string,
    durationMinutes: number,
    notes?: string
  ): Promise<Consultation> => {
    const res: AxiosResponse<ApiResponse<Consultation>> = await httpClient.post(
      '/consultations',
      { doctorId, scheduledFor, durationMinutes, notes }
    );
    return res.data?.data ?? res.data;
  },

  getConsultation: async (id: string): Promise<Consultation> => {
    const res: AxiosResponse<ApiResponse<Consultation>> = await httpClient.get(
      `/consultations/${id}`
    );
    return res.data?.data ?? res.data;
  },

  getUserConsultations: async (status?: string): Promise<Consultation[]> => {
    const res: AxiosResponse<ApiResponse<Consultation[]>> = await httpClient.get(
      '/consultations/user/list',
      { params: status ? { status } : {} }
    );
    return res.data?.data ?? [];
  },

  getDoctorConsultations: async (status?: string): Promise<Consultation[]> => {
    const res: AxiosResponse<ApiResponse<Consultation[]>> = await httpClient.get(
      '/consultations/doctor/list',
      { params: status ? { status } : {} }
    );
    return res.data?.data ?? [];
  },

  prepareCall: async (id: string): Promise<any> => {
    const res: AxiosResponse<ApiResponse<any>> = await httpClient.post(
      `/consultations/${id}/prepare-call`,
      {}
    );
    return res.data?.data ?? res.data;
  },

  startCall: async (id: string): Promise<Consultation> => {
    const res: AxiosResponse<ApiResponse<Consultation>> = await httpClient.post(
      `/consultations/${id}/start-call`,
      {}
    );
    return res.data?.data ?? res.data;
  },

  endCall: async (id: string): Promise<Consultation> => {
    const res: AxiosResponse<ApiResponse<Consultation>> = await httpClient.post(
      `/consultations/${id}/end-call`,
      {}
    );
    return res.data?.data ?? res.data;
  },

  cancelConsultation: async (id: string, reason: string): Promise<Consultation> => {
    const res: AxiosResponse<ApiResponse<Consultation>> = await httpClient.post(
      `/consultations/${id}/cancel`,
      { reason }
    );
    return res.data?.data ?? res.data;
  },

  getOrCreateFromBooking: async (
    bookingId: string,
    doctorId: string,
    scheduledFor: string,
    durationMinutes: number
  ): Promise<Consultation> => {
    const res: AxiosResponse<ApiResponse<Consultation>> = await httpClient.post(
      '/consultations/booking/get-or-create',
      { bookingId, doctorId, scheduledFor, durationMinutes }
    );
    return res.data?.data ?? res.data;
  },
};
