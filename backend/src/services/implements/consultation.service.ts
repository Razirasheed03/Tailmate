// services/implements/consultation.service.ts
import { Types } from "mongoose";
import { IConsultationRepository } from "../../repositories/interfaces/consultation.repository.interface";
import { IBookingRepository } from "../../repositories/interfaces/booking.repository.interface";
import { Doctor } from "../../schema/doctor.schema";
import { IConsultationService } from "../interfaces/consultation.service.interface";

// Helper function to safely extract ObjectId string from populated or non-populated field
const extractObjectIdString = (field: any): string => {
  if (!field) return "";
  
  // If it's already a string
  if (typeof field === "string") return field;
  
  // If it's a Mongoose ObjectId
  if (field instanceof Types.ObjectId) return field.toString();
  
  // If it's a populated object with _id
  if (typeof field === "object" && field._id) {
    return field._id instanceof Types.ObjectId 
      ? field._id.toString() 
      : String(field._id);
  }
  
  // Fallback: try toString (may return [object Object] if not handled above)
  return String(field);
};

const generateVideoRoomId = async (repo: IConsultationRepository): Promise<string> => {
  const chars = "1234567890abcdefghijklmnopqrstuvwxyz";
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    let result = "";
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const videoRoomId = `room_${result}`;
    const existing = await repo.findByVideoRoomId(videoRoomId);
    if (!existing) {
      return videoRoomId;
    }
    attempts++;
  }
  
  throw new Error("Failed to generate unique videoRoomId");
};

export class ConsultationService implements IConsultationService {
  constructor(
    private readonly _repo: IConsultationRepository,
    private readonly _bookingRepo: IBookingRepository
  ) {}

  async create(userId: string, doctorProfileId: string, payload: any) {
    if (!doctorProfileId?.trim()) {
      throw Object.assign(new Error("doctorId is required"), { status: 400 });
    }
    if (!payload.scheduledFor) {
      throw Object.assign(new Error("scheduledFor is required"), { status: 400 });
    }

    const scheduledDate = new Date(payload.scheduledFor);
    if (isNaN(scheduledDate.getTime())) {
      throw Object.assign(new Error("Invalid scheduledFor date"), { status: 400 });
    }

    if (scheduledDate < new Date()) {
      throw Object.assign(new Error("Cannot schedule consultation in the past"), { status: 400 });
    }

    const durationMinutes = payload.durationMinutes || 30;
    if (durationMinutes < 5 || durationMinutes > 480) {
      throw Object.assign(new Error("Duration must be between 5 and 480 minutes"), { status: 400 });
    }

    return this._repo.create(userId, doctorProfileId, {
      scheduledFor: scheduledDate,
      durationMinutes,
      notes: payload.notes || null,
    });
  }

  async getConsultation(consultationId: string) {
    const consultation = await this._repo.findById(consultationId);
    if (!consultation) {
      throw Object.assign(new Error("Consultation not found"), { status: 404 });
    }
    return consultation;
  }

  async getUserConsultations(userId: string, status?: string) {
    return this._repo.listUserConsultations(userId, status);
  }

  async getDoctorConsultations(doctorProfileId: string, status?: string) {
    return this._repo.listDoctorConsultations(doctorProfileId, status);
  }

  async prepareConsultationCall(
    consultationId: string,
    authUserId: string,
    authDoctorId?: string,
    role?: string
  ) {
    const consultation = await this._repo.findById(consultationId);
    if (!consultation) {
      throw Object.assign(new Error("Consultation not found"), { status: 404 });
    }

    // Extract normalized IDs using helper function
    const patientUserId = extractObjectIdString(consultation.userId);
    const doctorProfileId = extractObjectIdString(consultation.doctorId);
    
    // Extract doctor's User ID (from populated Doctor.userId)
    const doctorUserId = consultation.doctorId && typeof consultation.doctorId === "object"
      ? extractObjectIdString(consultation.doctorId.userId)
      : null;

    console.log("[prepareCall] Consultation data:", {
      consultationId,
      patientUserId,
      doctorProfileId,
      doctorUserId,
    });

    if (!patientUserId) {
      throw Object.assign(new Error("Consultation missing patient user ID"), { status: 400 });
    }
    if (!doctorProfileId) {
      throw Object.assign(new Error("Consultation missing doctor profile ID"), { status: 400 });
    }

    const normalizedAuthUserId = authUserId?.toString() || "";
    const normalizedAuthDoctorId = authDoctorId?.toString() || "";

    const isPatient = normalizedAuthUserId === patientUserId;
    const isDoctorByProfile = role === "doctor" && normalizedAuthDoctorId && normalizedAuthDoctorId === doctorProfileId;
    const isDoctorByUserId = role === "doctor" && doctorUserId && normalizedAuthUserId === doctorUserId;
    const isDoctor = isDoctorByProfile || isDoctorByUserId;

    console.log("[prepareCall] Authorization check:", {
      authUserId: normalizedAuthUserId,
      authDoctorId: normalizedAuthDoctorId,
      role,
      isPatient,
      isDoctor,
    });

    if (!isPatient && !isDoctor) {
      console.error("[prepareCall] AUTHORIZATION FAILED");
      throw Object.assign(new Error("You are not allowed to join this call"), { status: 403 });
    }

    if (consultation.status === "cancelled") {
      throw Object.assign(new Error("Consultation has been cancelled"), { status: 400 });
    }

    if (consultation.status === "completed") {
      throw Object.assign(new Error("Consultation has already been completed"), { status: 400 });
    }

    let videoRoomId = consultation.videoRoomId;
    if (!videoRoomId) {
      videoRoomId = await generateVideoRoomId(this._repo);
    }

    const updates: any = { videoRoomId };
    if (consultation.status !== "in_progress") {
      updates.status = "in_progress";
      updates.callStartedAt = new Date();
    }

    const updated = await this._repo.findByIdAndUpdate(consultationId, updates);

    return {
      consultationId,
      videoRoomId: updated?.videoRoomId || videoRoomId,
      status: updated?.status,
      scheduledFor: updated?.scheduledFor,
      durationMinutes: updated?.durationMinutes,
    };
  }

  async endConsultationCall(consultationId: string, userId: string, doctorId?: string, io?: any) {
    const consultation = await this._repo.findById(consultationId);
    if (!consultation) {
      throw Object.assign(new Error("Consultation not found"), { status: 404 });
    }

    // Use helper function to extract IDs
    const patientUserId = extractObjectIdString(consultation.userId);
    const doctorProfileId = extractObjectIdString(consultation.doctorId);

    const normalizedUserId = userId?.toString() || "";
    const normalizedDoctorId = doctorId?.toString() || "";

    const isPatient = normalizedUserId === patientUserId;
    const isDoctor = normalizedDoctorId && normalizedDoctorId === doctorProfileId;

    console.log("[endConsultationCall] Authorization check:", {
      userId: normalizedUserId,
      doctorId: normalizedDoctorId,
      patientUserId,
      doctorProfileId,
      isPatient,
      isDoctor,
    });

    if (!isPatient && !isDoctor) {
      throw Object.assign(new Error("Unauthorized"), { status: 403 });
    }

    if (isPatient && !isDoctor) {
      console.log("[endConsultationCall] Patient attempted to end call - not allowed");
      throw Object.assign(
        new Error("Only the doctor can end the consultation. You can rejoin if the doctor is still available."),
        { status: 403, isPatientLeaving: true }
      );
    }

    if (consultation.status === "completed") {
      console.log("[endConsultationCall] Call already completed");
      return consultation;
    }

    const updated = await this._repo.findByIdAndUpdate(consultationId, {
      status: "completed",
      callEndedAt: new Date(),
    });

    if (io && consultation.videoRoomId) {
      const roomName = `consultation:${consultation.videoRoomId}`;
      console.log("[endConsultationCall] Emitting consultation_call_ended to room:", roomName);
      io.to(roomName).emit("consultation:call-ended", {
        consultationId,
        endedBy: "doctor",
        timestamp: new Date(),
      });
    }

    return updated;
  }

  async cancelConsultation(consultationId: string, userId: string, reason: string) {
    const consultation = await this._repo.findById(consultationId);
    if (!consultation) {
      throw Object.assign(new Error("Consultation not found"), { status: 404 });
    }

    // Use helper function
    const patientUserId = extractObjectIdString(consultation.userId);
    const doctorProfileId = extractObjectIdString(consultation.doctorId);

    const isPatient = userId === patientUserId;
    const isDoctor = userId === doctorProfileId;

    if (!isPatient && !isDoctor) {
      throw Object.assign(new Error("Unauthorized"), { status: 403 });
    }

    if (consultation.status === "completed" || consultation.status === "cancelled") {
      return consultation;
    }

    return this._repo.cancel(consultationId, userId, reason);
  }

  async getConsultationByVideoRoomId(videoRoomId: string) {
    const consultation = await this._repo.findByVideoRoomId(videoRoomId);
    if (!consultation) {
      throw Object.assign(new Error("Consultation not found"), { status: 404 });
    }
    return consultation;
  }

  async getOrCreateConsultationFromBooking(
    bookingId: string,
    patientUserId: string,
    doctorUserId: string,
    scheduledFor: string,
    durationMinutes: number,
    retryCount: number = 0
  ): Promise<any> {
    const maxRetries = 5;
    
    console.log("[getOrCreateConsultationFromBooking] Input:", {
      bookingId,
      patientUserId,
      doctorUserId,
      retryCount,
    });

    try {
      console.log("[getOrCreateConsultationFromBooking] Looking up Doctor with userId:", doctorUserId);
      let doctorProfile = await Doctor.findOne({ userId: new Types.ObjectId(doctorUserId) });
      
      if (!doctorProfile) {
        console.log("[getOrCreateConsultationFromBooking] Doctor profile not found, creating...");
        doctorProfile = await Doctor.create({
          userId: new Types.ObjectId(doctorUserId),
          profile: {},
          verification: { status: "pending" },
        });
        console.log("[getOrCreateConsultationFromBooking] Created Doctor profile:", doctorProfile._id);
      }

      const doctorProfileId = doctorProfile._id.toString();
      const patientUserIdObj = new Types.ObjectId(patientUserId);
      const doctorProfileIdObj = new Types.ObjectId(doctorProfileId);
      const scheduledDate = new Date(scheduledFor);
      const videoRoomId = await generateVideoRoomId(this._repo);

      console.log("[getOrCreateConsultationFromBooking] Checking for existing consultation by bookingId:", bookingId);
      let existingConsultation = await this._repo.findByBookingId(bookingId);

      if (existingConsultation) {
        // FIXED: Use helper function to extract ID from potentially populated field
        const existingUserId = extractObjectIdString(existingConsultation.userId);
        const expectedUserId = patientUserIdObj.toString();
        
        console.log("[getOrCreateConsultationFromBooking] Found existing consultation:", {
          _id: existingConsultation._id,
          existingUserId,
          expectedUserId,
          match: existingUserId === expectedUserId,
        });

        if (existingUserId !== expectedUserId) {
          console.warn("[getOrCreateConsultationFromBooking] ⚠️ CORRUPTED: userId mismatch!");
          console.warn("[getOrCreateConsultationFromBooking] Expected:", expectedUserId, "Got:", existingUserId);
          console.log("[getOrCreateConsultationFromBooking] Deleting corrupted consultation...");
          
          await this._repo.deleteByBookingId(bookingId);
          existingConsultation = null;
        } else {
          console.log("[getOrCreateConsultationFromBooking] Consultation is valid, returning existing one");
          return await this._repo.findById(existingConsultation._id.toString());
        }
      }

      console.log("[getOrCreateConsultationFromBooking] Creating new consultation with atomic upsert");
      
      const consultation = await this._repo.findOneAndUpsert(
        {
          bookingId: bookingId,
          status: { $ne: "cancelled" },
        },
        {
          $setOnInsert: {
            userId: patientUserIdObj,
            doctorId: doctorProfileIdObj,
            scheduledFor: scheduledDate,
            durationMinutes,
            videoRoomId,
            notes: `Booking: ${bookingId}`,
            status: "upcoming",
          },
        },
        { 
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

      console.log("[getOrCreateConsultationFromBooking] Got consultation:", {
        _id: consultation._id,
        videoRoomId: consultation.videoRoomId,
      });

      // FIXED: Use helper function for final validation
      const finalUserId = extractObjectIdString(consultation.userId);
      const finalDoctorId = extractObjectIdString(consultation.doctorId);
      
      console.log("[getOrCreateConsultationFromBooking] Final validation:", {
        finalUserId,
        expectedPatientId: patientUserIdObj.toString(),
        finalDoctorId,
        expectedDoctorId: doctorProfileIdObj.toString(),
      });
      
      if (finalUserId !== patientUserIdObj.toString()) {
        throw Object.assign(
          new Error(`CRITICAL: Consultation userId mismatch. Expected: ${patientUserIdObj}, Got: ${finalUserId}`),
          { status: 500 }
        );
      }
      
      if (finalDoctorId !== doctorProfileIdObj.toString()) {
        throw Object.assign(
          new Error(`CRITICAL: Consultation doctorId mismatch. Expected: ${doctorProfileIdObj}, Got: ${finalDoctorId}`),
          { status: 500 }
        );
      }

      return await this._repo.findById(consultation._id.toString());
    } catch (error: any) {
      if (error.code === 11000) {
        console.warn("[getOrCreateConsultationFromBooking] Duplicate key error (race condition)");
        
        if (retryCount < maxRetries) {
          const waitTime = 50 * Math.pow(2, retryCount);
          console.log(`[getOrCreateConsultationFromBooking] Retrying in ${waitTime}ms (attempt ${retryCount + 1}/${maxRetries})...`);
          
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          return this.getOrCreateConsultationFromBooking(
            bookingId,
            patientUserId,
            doctorUserId,
            scheduledFor,
            durationMinutes,
            retryCount + 1
          );
        } else {
          console.log("[getOrCreateConsultationFromBooking] Max retries reached, searching for existing consultation...");
          const existing = await this._repo.findByBookingId(bookingId);
          
          if (existing) {
            console.log("[getOrCreateConsultationFromBooking] Found existing consultation after retries:", existing._id);
            return await this._repo.findById(existing._id.toString());
          }
          
          throw error;
        }
      }
      
      throw error;
    }
  }
}