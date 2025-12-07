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
    const patientUserId = typeof consultation.userId === "object"
      ? (consultation.userId as any)._id?.toString()
      : consultation.userId?.toString();

    const doctorProfileId = typeof consultation.doctorId === "object"
      ? (consultation.doctorId as any)._id?.toString()
      : consultation.doctorId?.toString();

    // CRITICAL: Also extract the doctor's User ID for comparison
    const doctorUserId = typeof consultation.doctorId === "object" && (consultation.doctorId as any).userId
      ? typeof (consultation.doctorId as any).userId === "object"
        ? ((consultation.doctorId as any).userId as any)._id?.toString()
        : (consultation.doctorId as any).userId?.toString()
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

    // Authorization: Patient OR Doctor
    // Patient: authUserId matches consultation.userId (User._id)
    // Doctor: EITHER authDoctorId matches Doctor._id OR authUserId matches Doctor.userId
    const isPatient = authUserId === patientUserId;
    const isDoctorByProfile = role === "doctor" && authDoctorId && authDoctorId === doctorProfileId;
    const isDoctorByUserId = role === "doctor" && doctorUserId && authUserId === doctorUserId;
    const isDoctor = isDoctorByProfile || isDoctorByUserId;

    console.log("[prepareCall] Authorization:", {
      authUserId,
      authDoctorId,
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
      console.error("[prepareCall] AUTHORIZATION FAILED");
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

  async endConsultationCall(consultationId: string, userId: string) {
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

    // Only patient or doctor can end the call
    const isPatient = userId === patientUserId;
    const isDoctor = userId === doctorProfileId;

    if (!isPatient && !isDoctor) {
      throw Object.assign(new Error("Unauthorized"), { status: 403 });
    }

    if (consultation.status === "completed") {
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
   * CRITICAL: Booking.doctorId is User._id, but Consultation.doctorId must be Doctor._id
   */
  async getOrCreateConsultationFromBooking(
    bookingId: string,
    patientUserId: string,
    doctorUserId: string,
    scheduledFor: string,
    durationMinutes: number
  ) {
    console.log("[getOrCreateConsultationFromBooking] Input:", {
      bookingId,
      patientUserId,
      doctorUserId,
      scheduledFor,
      durationMinutes,
    });

    // Resolve Doctor profile ID from doctor's User ID FIRST
    // (we need this to search by doctorId)
    console.log("[getOrCreateConsultationFromBooking] Looking up Doctor with userId:", doctorUserId);
    let doctorProfile = await Doctor.findOne({ userId: new Types.ObjectId(doctorUserId) });
    
    if (!doctorProfile) {
      console.warn("[getOrCreateConsultationFromBooking] Doctor profile NOT found for userId:", doctorUserId);
      console.log("[getOrCreateConsultationFromBooking] Creating Doctor profile...");
      
      // Create Doctor profile if it doesn't exist
      doctorProfile = await Doctor.create({
        userId: new Types.ObjectId(doctorUserId),
        profile: {},
        verification: { status: "pending" },
      });
      
      console.log("[getOrCreateConsultationFromBooking] Created Doctor profile:", doctorProfile._id);
    }

    const doctorProfileId = doctorProfile._id.toString();
    console.log("[getOrCreateConsultationFromBooking] Resolved doctorProfileId:", doctorProfileId);

    // ATOMIC: Use findOneAndUpdate with upsert on bookingId
    // This ensures only ONE consultation is created per bookingId, even with concurrent requests
    const scheduledDate = new Date(scheduledFor);
    
    console.log("[getOrCreateConsultationFromBooking] Using atomic upsert by bookingId:", bookingId);
    
    const consultation = await this._repo.model.findOneAndUpdate(
      { bookingId: bookingId }, // Filter by bookingId - UNIQUE constraint
      {
        $setOnInsert: {
          userId: new Types.ObjectId(patientUserId),
          doctorId: new Types.ObjectId(doctorProfileId),
          scheduledFor: scheduledDate,
          durationMinutes,
          notes: `Booking: ${bookingId}`,
          status: "upcoming",
        },
      },
      { upsert: true, new: true }
    );

    console.log("[getOrCreateConsultationFromBooking] Got consultation (created or found):", consultation._id);

    // Verify the consultation has correct data
    const consultationUserId = consultation.userId.toString();
    if (consultationUserId !== patientUserId) {
      console.warn("[getOrCreateConsultationFromBooking] ⚠️ FOUND CONSULTATION WITH WRONG userId!");
      console.warn("[getOrCreateConsultationFromBooking] Expected userId:", patientUserId);
      console.warn("[getOrCreateConsultationFromBooking] Actual userId:", consultationUserId);
      console.warn("[getOrCreateConsultationFromBooking] Deleting and recreating...");
      
      // Delete the corrupted consultation
      await this._repo.model.deleteOne({ _id: consultation._id });
      
      // Recursively call to create new one
      return this.getOrCreateConsultationFromBooking(
        bookingId,
        patientUserId,
        doctorUserId,
        scheduledFor,
        durationMinutes
      );
    }

    return await this._repo.findById(consultation._id.toString());
  }
}