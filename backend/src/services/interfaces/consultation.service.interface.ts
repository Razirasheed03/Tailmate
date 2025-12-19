//services/interfaces/consultation.service.interface.ts
import { Types } from "mongoose";

export interface IConsultationService {
  create(
    userId: string,
    doctorProfileId: string,
    payload: {
      scheduledFor: string;
      durationMinutes?: number;
      notes?: string | null;
    }
  ): Promise<any>;

  getConsultation(consultationId: string): Promise<any>;

  getUserConsultations(userId: string, status?: string): Promise<any[]>;

  getDoctorConsultations(
    doctorProfileId: string,
    status?: string
  ): Promise<any[]>;

  // updateById(
  //   id: string,
  //   update: Partial<{
  //     userId: Types.ObjectId;
  //     doctorId: Types.ObjectId;
  //     status: string;
  //     videoRoomId: string;
  //     callStartedAt: Date;
  //     callEndedAt: Date;
  //   }>
  // ): Promise<any | null>;
  prepareConsultationCall(
    consultationId: string,
    authUserId: string,
    authDoctorId?: string,
    role?: string
  ): Promise<{
    consultationId: string;
    videoRoomId: string;
    status: string;
    scheduledFor: Date;
    durationMinutes: number;
  }>;

  endConsultationCall(
    consultationId: string,
    userId: string,
    doctorId?: string,
    io?: unknown
  ): Promise<any>;

  cancelConsultation(
    consultationId: string,
    userId: string,
    reason: string
  ): Promise<any>;

  getConsultationByVideoRoomId(videoRoomId: string): Promise<any>;

  getOrCreateConsultationFromBooking(
    bookingId: string,
    patientUserId: string,
    doctorUserId: string,
    scheduledFor: string,
    durationMinutes: number
  ): Promise<any>;
}
