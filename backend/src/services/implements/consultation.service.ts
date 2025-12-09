import { Types } from "mongoose";
import { ConsultationRepository } from "../../repositories/implements/consultation.repository";
import { BookingRepository } from "../../repositories/implements/booking.repository";
import { Doctor } from "../../schema/doctor.schema";

const generateVideoRoomId = async (repo: ConsultationRepository): Promise<string> => {
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

export class ConsultationService {
  private _repo = new ConsultationRepository();
  private _bookingRepo = new BookingRepository();

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

  /**
   * Prepare consultation call for WebRTC
   * Both doctor and patient call this endpoint
   * Doctor: authDoctorId (Doctor._id) must match consultation.doctorId
   * Patient: authUserId (User._id) must match consultation.userId
   */
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

    // Extract normalized IDs from consultation
    // Handle both populated objects and raw ObjectIds
    const patientUserId = consultation.userId
      ? typeof consultation.userId === "object"
        ? (consultation.userId as any)._id?.toString() || (consultation.userId as any).toString()
        : consultation.userId.toString()
      : null;

    const doctorProfileId = consultation.doctorId
      ? typeof consultation.doctorId === "object"
        ? (consultation.doctorId as any)._id?.toString() || (consultation.doctorId as any).toString()
        : consultation.doctorId.toString()
      : null;

    // Extract doctor's User ID for comparison (from populated Doctor object)
    const doctorUserId = consultation.doctorId && typeof consultation.doctorId === "object"
      ? (consultation.doctorId as any).userId
        ? typeof (consultation.doctorId as any).userId === "object"
          ? ((consultation.doctorId as any).userId as any)._id?.toString() || ((consultation.doctorId as any).userId as any).toString()
          : (consultation.doctorId as any).userId.toString()
        : null
      : null;

    console.log("[prepareCall] Consultation data:", {
      consultationId,
      userId: consultation.userId,
      doctorId: consultation.doctorId,
      patientUserId,
      doctorProfileId,
      doctorUserId,
    });

    // Validate that we have the required IDs
    if (!patientUserId) {
      throw Object.assign(new Error("Consultation missing patient user ID"), { status: 400 });
    }
    if (!doctorProfileId) {
      throw Object.assign(new Error("Consultation missing doctor profile ID"), { status: 400 });
    }

    // Normalize authUserId for comparison
    const normalizedAuthUserId = authUserId?.toString() || "";
    const normalizedAuthDoctorId = authDoctorId?.toString() || "";

    // Authorization: Patient OR Doctor
    // Patient: authUserId matches consultation.userId (User._id)
    // Doctor: EITHER authDoctorId matches Doctor._id OR authUserId matches Doctor.userId
    const isPatient = normalizedAuthUserId === patientUserId;
    const isDoctorByProfile = role === "doctor" && normalizedAuthDoctorId && normalizedAuthDoctorId === doctorProfileId;
    const isDoctorByUserId = role === "doctor" && doctorUserId && normalizedAuthUserId === doctorUserId;
    const isDoctor = isDoctorByProfile || isDoctorByUserId;

    console.log("[prepareCall] Authorization check:", {
      authUserId: normalizedAuthUserId,
      authDoctorId: normalizedAuthDoctorId,
      role,
      patientUserId,
      doctorProfileId,
      doctorUserId,
      isPatient,
      isDoctorByProfile,
      isDoctorByUserId,
      isDoctor,
    });

    if (!isPatient && !isDoctor) {
      console.error("[prepareCall] AUTHORIZATION FAILED", {
        authUserId: normalizedAuthUserId,
        patientUserId,
        authDoctorId: normalizedAuthDoctorId,
        doctorProfileId,
      });
      throw Object.assign(new Error("You are not allowed to join this call"), { status: 403 });
    }

    // Check consultation status
    if (consultation.status === "cancelled") {
      throw Object.assign(new Error("Consultation has been cancelled"), { status: 400 });
    }

    if (consultation.status === "completed") {
      throw Object.assign(new Error("Consultation has already been completed"), { status: 400 });
    }

    // Generate videoRoomId if not exists
    let videoRoomId = consultation.videoRoomId;
    if (!videoRoomId) {
      videoRoomId = await generateVideoRoomId(this._repo);
    }

    // Update status to in_progress
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

  async endConsultationCall(consultationId: string, userId: string, doctorId?: string) {
    const consultation = await this._repo.findById(consultationId);
    if (!consultation) {
      throw Object.assign(new Error("Consultation not found"), { status: 404 });
    }

    const patientUserId = typeof consultation.userId === "object"
      ? (consultation.userId as any)._id?.toString()
      : consultation.userId?.toString();

    const doctorProfileId = typeof consultation.doctorId === "object"
      ? (consultation.doctorId as any)._id?.toString()
      : consultation.doctorId?.toString();

    // Normalize IDs for comparison
    const normalizedUserId = userId?.toString() || "";
    const normalizedDoctorId = doctorId?.toString() || "";

    // Authorization: Patient OR Doctor
    // Patient: userId matches consultation.userId (User._id)
    // Doctor: doctorId matches consultation.doctorId (Doctor._id)
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

    // If already completed, return it (idempotent)
    if (consultation.status === "completed") {
      console.log("[endConsultationCall] Call already completed, returning existing");
      return consultation;
    }

    const updated = await this._repo.findByIdAndUpdate(consultationId, {
      status: "completed",
      callEndedAt: new Date(),
    });

    return updated;
  }

  async cancelConsultation(consultationId: string, userId: string, reason: string) {
    const consultation = await this._repo.findById(consultationId);
    if (!consultation) {
      throw Object.assign(new Error("Consultation not found"), { status: 404 });
    }

    const patientUserId = typeof consultation.userId === "object"
      ? (consultation.userId as any)._id?.toString()
      : consultation.userId?.toString();

    const doctorProfileId = typeof consultation.doctorId === "object"
      ? (consultation.doctorId as any)._id?.toString()
      : consultation.doctorId?.toString();

    // Only patient or doctor can cancel
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

  /**
   * Create or get consultation from booking
   * CRITICAL: Uses atomic findOneAndUpdate with upsert to prevent race conditions
   * Booking.doctorId is User._id, but Consultation.doctorId must be Doctor._id
   * 
   * STRICT VALIDATION:
   * - Consultation.userId MUST be patientUserId
   * - Consultation.doctorId MUST be Doctor._id (doctor profile, not user)
   * - If corrupted, DELETE and RECREATE
   */
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
      // Step 1: Resolve Doctor profile ID from doctor's User ID
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

      // Step 2: Check if consultation already exists
      console.log("[getOrCreateConsultationFromBooking] Checking for existing consultation by bookingId:", bookingId);
      let existingConsultation = await this._repo.model.findOne({
        bookingId: bookingId,
        status: { $ne: "cancelled" },
      });

      // Step 3: If exists, validate it has correct userId
      if (existingConsultation) {
        const existingUserId = existingConsultation.userId.toString();
        const expectedUserId = patientUserIdObj.toString();
        
        console.log("[getOrCreateConsultationFromBooking] Found existing consultation:", {
          _id: existingConsultation._id,
          existingUserId,
          expectedUserId,
          match: existingUserId === expectedUserId,
        });

        // If userId is WRONG, delete and recreate
        if (existingUserId !== expectedUserId) {
          console.warn("[getOrCreateConsultationFromBooking] ⚠️ CORRUPTED: userId mismatch!");
          console.warn("[getOrCreateConsultationFromBooking] Expected:", expectedUserId, "Got:", existingUserId);
          console.log("[getOrCreateConsultationFromBooking] Deleting corrupted consultation...");
          
          await this._repo.model.deleteOne({ _id: existingConsultation._id });
          
          // Fall through to create new one
          existingConsultation = null;
        } else {
          // userId is correct, return it
          console.log("[getOrCreateConsultationFromBooking] Consultation is valid, returning existing one");
          return await this._repo.findById(existingConsultation._id.toString());
        }
      }

      // Step 4: Create new consultation with ATOMIC upsert
      console.log("[getOrCreateConsultationFromBooking] Creating new consultation with atomic upsert");
      
      const consultation = await this._repo.model.findOneAndUpdate(
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
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      console.log("[getOrCreateConsultationFromBooking] Got consultation:", {
        _id: consultation._id,
        videoRoomId: consultation.videoRoomId,
        userId: consultation.userId.toString(),
        doctorId: consultation.doctorId.toString(),
      });

      // Step 5: Final validation before returning
      const finalUserId = consultation.userId.toString();
      const finalDoctorId = consultation.doctorId.toString();
      
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

      // Return fully populated consultation
      return await this._repo.findById(consultation._id.toString());
    } catch (error: any) {
      // Handle duplicate key error (race condition from concurrent requests)
      if (error.code === 11000) {
        console.warn("[getOrCreateConsultationFromBooking] Duplicate key error (race condition):", error.message);
        
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
          // After max retries, try to find existing consultation
          console.log("[getOrCreateConsultationFromBooking] Max retries reached, searching for existing consultation...");
          const existing = await this._repo.model.findOne({
            bookingId: bookingId,
            status: { $ne: "cancelled" },
          });
          
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