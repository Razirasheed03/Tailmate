// backend/src/repositories/interfaces/doctor.repository.interface.ts
import { IDoctorModel, IDoctorVerification, IDoctorProfile, UpdateProfileDTO } from "../../models/interfaces/doctor.model.interface";

export interface IDoctorRepository {
  createIfMissing(userId: string): Promise<IDoctorModel>;
  getVerification(userId: string): Promise<IDoctorVerification>;
  submitCertificate(userId: string, certificateUrl: string): Promise<IDoctorModel>;
  getProfile(userId: string): Promise<IDoctorProfile>;
  updateProfile(userId: string, profile: Partial<UpdateProfileDTO>): Promise<IDoctorProfile>;
  saveCertificateUrl(userId: string, certificateUrl: string): Promise<IDoctorVerification>;
  submitForReview(userId: string): Promise<IDoctorModel>;
  listSessions(doctorId: string, opts: {
    page: number;
    limit: number;
    scope: "upcoming" | "today" | "past";
    mode?: "video" | "audio" | "inPerson";
    q?: string;
  }): Promise<{ items: any[]; total: number }>;

  getSession(doctorId: string, bookingId: string): Promise<any | null>;
  doctorDashboard(doctorId:string):Promise<any|null>;
    getBookingStatusCounts(doctorId: string): Promise<{
    pending: number;
    completed: number;
    cancelled: number;
  }>;
   getDashboardStats(doctorId: string): Promise<{
    appointmentsToday: number;
    totalPatients: number;
    earningsThisMonth: number;
    chart: {
      months: string[];
      earnings: number[];
    };
  }>;

  getDoctorBookingTrends(doctorId: string): Promise<
    Array<{
      categoryName: string;
      count: number;
    }>
  >;


}
