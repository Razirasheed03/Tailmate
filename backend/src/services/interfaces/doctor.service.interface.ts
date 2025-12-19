// src/services/interfaces/doctor.service.interface.ts

import {
  IDoctorVerification,
  IDoctorProfile,
  IDoctorModel,
  UpdateProfileDTO,
} from "../../models/interfaces/doctor.model.interface";
import { DoctorSlotEntity } from "../../schema/doctorSlot.schema";

export interface IDoctorService {
  /* ===================== VERIFICATION ===================== */
  getVerification(userId: string): Promise<IDoctorVerification>;
  uploadCertificate(
    userId: string,
    certificateUrl: string
  ): Promise<IDoctorVerification>;
  submitForReview(userId: string): Promise<IDoctorModel>;

  /* ===================== PROFILE ===================== */
  getProfile(userId: string): Promise<IDoctorProfile>;
  updateProfile(
    userId: string,
    payload: Partial<UpdateProfileDTO>
  ): Promise<IDoctorProfile>;

//   uploadAvatar(userId: string, avatarUrl: string): Promise<any>;

  /* ===================== DAY SLOTS ===================== */
  listDaySlots(userId: string, date: string): Promise<DoctorSlotEntity[]>;

  saveDaySchedule(
    userId: string,
    payload: {
      date: string;
      slots: Array<{
        time: string;
        durationMins: number;
        fee: number;
        modes: ("video" | "audio" | "inPerson")[];
        status: "available" | "booked";
      }>;
    }
  ): Promise<DoctorSlotEntity[]>;

  createDaySlot(userId: string, payload: any): Promise<DoctorSlotEntity>;
  updateSlotStatus(
  userId: string,
  slotId: string,
  status: "available" | "booked"
): Promise<DoctorSlotEntity | null>;

  deleteDaySlot(userId: string, slotId: string): Promise<boolean>;

  /* ===================== SESSIONS ===================== */
  listSessions(
    doctorId: string,
    params: {
      page: number;
      limit: number;
      scope: "upcoming" | "today" | "past";
      mode?: "video" | "audio" | "inPerson";
      q?: string;
    }
  ): Promise<{ items: any[]; total: number }>;

  getSession(doctorId: string, sessionId: string): Promise<any | null>;

  /* ===================== AVAILABILITY RULES ===================== */
  getWeeklyRules(userId: string): Promise<any>;
  saveWeeklyRules(userId: string, rules: any[]): Promise<any>;
  generateAvailability(
    userId: string,
    from: string,
    to: string,
    rules?: any[]
  ): Promise<any>;

  /* ===================== PAYMENTS ===================== */
  createStripeOnboarding(
    userId: string
  ): Promise<{ url: string | null; alreadyConnected: boolean }>;

  /* ===================== DASHBOARD ===================== */
  doctorDashboard(doctorId: string): Promise<any>;
  getBookingStatusCounts(doctorId: string): Promise<any>;
  getDashboardStats(doctorId: string): Promise<any>;
  getPetBookingTrends(doctorId: string): Promise<any>;
}
