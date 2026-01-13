//controllers/consultation.controller.ts
import { Request, Response, NextFunction } from "express";
import { ResponseHelper } from "../../http/ResponseHelper";
import { HttpResponse } from "../../constants/messageConstant";
import { IConsultationService } from "../../services/interfaces/consultation.service.interface";

export class ConsultationController {
  constructor(private readonly consultationService: IConsultationService) {}
  
  // Public getter for DI access (socket layer)
  public getService(): IConsultationService {
    return this.consultationService;
  }
  
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id?.toString() || req.user?.id?.toString();
      if (!userId) {
        return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
      }

      const { doctorId } = req.body;
      const consultation = await this.consultationService.create(userId, doctorId, req.body || {});
      return ResponseHelper.created(res, consultation, "Consultation created");
    } catch (err) {
      next(err);
    }
  };

  getConsultation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const consultation = await this.consultationService.getConsultation(id);
      return ResponseHelper.ok(res, consultation, HttpResponse.RESOURCE_FOUND);
    } catch (err) {
      next(err);
    }
  };

  getUserConsultations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user?._id?.toString() || req.user?.id?.toString();
      if (!userId) {
        return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
      }

      const status = (req.query.status as string) || undefined;
      const consultations = await this.consultationService.getUserConsultations(userId, status);
      return ResponseHelper.ok(res, consultations, HttpResponse.RESOURCE_FOUND);
    } catch (err) {
      next(err);
    }
  };

  getDoctorConsultations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const doctorId = req.user?.doctorId?.toString() || req.user?.id?.toString();
      if (!doctorId) {
        return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
      }

      const status = (req.query.status as string) || undefined;
      const consultations = await this.consultationService.getDoctorConsultations(doctorId, status);
      return ResponseHelper.ok(res, consultations, HttpResponse.RESOURCE_FOUND);
    } catch (err) {
      next(err);
    }
  };

  prepareCall = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id?.toString();
      const doctorId = (req as any).user?.doctorId?.toString() || undefined;
      const role = (req as any).user?.role as string | undefined;

      if (!userId) {
        console.error("[prepareCall] No userId in request");
        return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
      }

      const { id } = req.params;

      console.log("[prepareCall] Request from:", {
        userId,
        doctorId,
        role,
        consultationId: id,
      });

      const result = await this.consultationService.prepareConsultationCall(id, userId, doctorId, role);

      return ResponseHelper.ok(res, result, "Call prepared");
    } catch (err) {
      console.error("[prepareCall] Error:", err);
      next(err);
    }
  };

  endCall = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id?.toString() || req.user?.id?.toString();
      const doctorId = req.user?.doctorId?.toString() || undefined;
      if (!userId) {
        return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
      }

      const { id } = req.params;
      // Import io from server
      const { io } = require("../../server");
      const consultation = await this.consultationService.endConsultationCall(id, userId, doctorId, io);
      return ResponseHelper.ok(res, consultation, "Call ended");
    } catch (err) {
      next(err);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id?.toString() || req.user?.id?.toString();
      if (!userId) {
        return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
      }

      const { id } = req.params;
      const { reason } = req.body;
      const consultation = await this.consultationService.cancelConsultation(id, userId, reason || "");
      return ResponseHelper.ok(res, consultation, "Consultation cancelled");
    } catch (err) {
      next(err);
    }
  };

  cancelByDoctor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id?.toString() || req.user?.id?.toString();
      const doctorId = req.user?.doctorId?.toString() || undefined;
      const role = req.user?.role as string | undefined;
      if (!userId) {
        return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
      }

      const { id } = req.params;
      const { reason } = req.body;
      const { io } = require("../../server");

      const result = await this.consultationService.cancelByDoctor(
        id,
        userId,
        doctorId,
        role,
        reason || "",
        io
      );

      return ResponseHelper.ok(res, result, "Consultation cancelled by doctor");
    } catch (err) {
      next(err);
    }
  };

  getOrCreateFromBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id?.toString() || req.user?.id?.toString();
      if (!userId) {
        return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
      }

      let { bookingId, doctorId, scheduledFor, durationMinutes } = req.body;
      
      console.log("[getOrCreateFromBooking] Received:", { bookingId, doctorId, scheduledFor, durationMinutes, userId });
      
      // Validate required fields with proper checks
      if (!bookingId || bookingId.toString().trim() === "") {
        return ResponseHelper.badRequest(res, "bookingId is required");
      }
      if (!doctorId || doctorId.toString().trim() === "") {
        return ResponseHelper.badRequest(res, "doctorId is required");
      }
      if (!scheduledFor || scheduledFor.toString().trim() === "") {
        return ResponseHelper.badRequest(res, "scheduledFor is required");
      }
      if (durationMinutes === undefined || durationMinutes === null || durationMinutes === "") {
        return ResponseHelper.badRequest(res, "durationMinutes is required");
      }

      // Ensure durationMinutes is a number
      durationMinutes = Number(durationMinutes);
      if (isNaN(durationMinutes) || durationMinutes <= 0) {
        return ResponseHelper.badRequest(res, "durationMinutes must be a positive number");
      }

      console.log("[getOrCreateFromBooking] Validated:", { bookingId, doctorId, scheduledFor, durationMinutes });

      // CRITICAL FIX: Fetch the booking to get the actual patientId
      // This ensures we use the correct patient ID, not the current user's ID
      // (which could be the doctor if doctor initiates the call)
      const Booking = require("../../schema/booking.schema").Booking;
      const booking = await Booking.findById(bookingId);
      
      if (!booking) {
        return ResponseHelper.notFound(res, "Booking not found");
      }

      const patientId = booking.patientId.toString();
      
      console.log("[getOrCreateFromBooking] Fetched booking:", { 
        bookingId, 
        patientId, 
        doctorId: booking.doctorId.toString(),
        currentUserId: userId 
      });

      const consultation = await this.consultationService.getOrCreateConsultationFromBooking(
        bookingId,
        patientId,  // Use patientId from booking, not from JWT
        doctorId,
        scheduledFor,
        durationMinutes
      );
      
      console.log("[getOrCreateFromBooking] Created/Found:", consultation._id);
      return ResponseHelper.ok(res, consultation, "Consultation retrieved/created");
    } catch (err) {
      console.error("[getOrCreateFromBooking] Error:", err);
      next(err);
    }
  };
}