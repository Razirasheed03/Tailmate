// backend/src/controllers/Implements/doctor.controller.ts
import { Request, Response, NextFunction } from "express";
import { DoctorService } from "../../services/implements/doctor.service";
import {
  uploadImageBufferToCloudinary,
  uploadPdfBufferToCloudinary,
} from "../../utils/uploadToCloudinary";
import { ResponseHelper } from "../../http/ResponseHelper";
import { HttpResponse } from "../../constants/messageConstant";

export class DoctorController {
  constructor(private readonly svc: DoctorService) {}

  getVerification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId) return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
      const data = await this.svc.getVerification(userId);
      return ResponseHelper.ok(res, data, HttpResponse.RESOURCE_FOUND);
    } catch (err) { next(err); }
  };

  uploadCertificate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId) return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);

      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) return ResponseHelper.badRequest(res, "No file uploaded");

      const { secure_url } = await uploadPdfBufferToCloudinary(file.buffer, file.originalname);
      const updated = await this.svc.submitCertificate(userId, secure_url);
      return ResponseHelper.ok(
        res,
        { certificateUrl: secure_url, verification: updated.verification },
        "Certificate uploaded and submitted for review"
      );
    } catch (err) { next(err); }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId) return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
      const data = await this.svc.getProfile(userId);
      return ResponseHelper.ok(res, data, HttpResponse.RESOURCE_FOUND);
    } catch (err: any) {
      const status = (err && err.status) || 500;
      return ResponseHelper.error(res, status, "PROFILE_ERROR", err?.message || "Failed to fetch profile");
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId) return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
      const payload = req.body || {};
      const data = await this.svc.updateProfile(userId, payload);
      return ResponseHelper.ok(res, data, HttpResponse.RESOURCE_UPDATED);
    } catch (err: any) {
      const status = (err && err.status) || 400;
      return ResponseHelper.error(res, status, "PROFILE_UPDATE_ERROR", err?.message || "Failed to update profile");
    }
  };

  uploadAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId) return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);

      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) return ResponseHelper.badRequest(res, "No image uploaded");

      const { secure_url } = await uploadImageBufferToCloudinary(file.buffer, file.originalname);
      return ResponseHelper.ok(res, { avatarUrl: secure_url }, HttpResponse.RESOURCE_UPDATED);
    } catch (err) { next(err); }
  };

  listDaySlots = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      const date = String(req.query.date || "");
      if (!date) return ResponseHelper.badRequest(res, "date is required");
      const data = await this.svc.listDaySlots(userId, date);
      return ResponseHelper.ok(res, data, HttpResponse.RESOURCE_FOUND);
    } catch (err) { next(err); }
  };

  saveDaySchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      const { date, slots } = req.body || {};
      if (!date || !Array.isArray(slots)) {
        return ResponseHelper.badRequest(res, "date and slots are required");
      }
      const data = await this.svc.saveDaySchedule(userId, { date, slots });
      return ResponseHelper.ok(res, data, HttpResponse.RESOURCE_UPDATED);
    } catch (err) { next(err); }
  };

  createDaySlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      const data = await this.svc.createDaySlot(userId, req.body);
      return ResponseHelper.created(res, data, HttpResponse.RESOURCE_FOUND);
    } catch (err) { next(err); }
  };

  updateSlotStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      const { status } = req.body || {};
      if (status !== "available" && status !== "booked") {
        return ResponseHelper.badRequest(res, "invalid status");
      }
      const data = await this.svc.updateSlotStatus(userId, req.params.id, status);
      return ResponseHelper.ok(res, data, HttpResponse.RESOURCE_UPDATED);
    } catch (err) { next(err); }
  };

  deleteDaySlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      const ok = await this.svc.deleteDaySlot(userId, req.params.id);
      if (!ok) return ResponseHelper.notFound(res, HttpResponse.PAGE_NOT_FOUND);
      return ResponseHelper.noContent(res);
    } catch (err) { next(err); }
  };

  listSessions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doctorId = (req as any).user?._id?.toString() || (req as any).user?.id;
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 10);
      const scope = String(req.query.scope || "upcoming") as "upcoming" | "today" | "past";
      const mode = req.query.mode ? (String(req.query.mode) as "video" | "audio" | "inPerson") : undefined;
      const q = req.query.q ? String(req.query.q) : undefined;
      const data = await this.svc.listSessions(doctorId, { page, limit, scope, mode, q });
      // Frontend expects { items, total } under data
      return ResponseHelper.ok(res, { items: data.items, total: data.total }, HttpResponse.RESOURCE_FOUND);
    } catch (err) { next(err); }
  };

  getSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doctorId = (req as any).user?._id?.toString() || (req as any).user?.id;
      const id = String(req.params.id);
      const row = await this.svc.getSession(doctorId, id);
      if (!row) return ResponseHelper.notFound(res, HttpResponse.PAGE_NOT_FOUND);
      return ResponseHelper.ok(res, row, HttpResponse.RESOURCE_FOUND);
    } catch (err) { next(err); }
  };

  // Weekly schedule
  getWeeklyRules = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId) return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
      const data = await this.svc.getWeeklyRules(userId);
      return ResponseHelper.ok(res, data, HttpResponse.RESOURCE_FOUND);
    } catch (err) { next(err); }
  };

  saveWeeklyRules = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId) return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
      const data = await this.svc.saveWeeklyRules(userId, req.body?.rules || []);
      return ResponseHelper.ok(res, data, HttpResponse.RESOURCE_UPDATED);
    } catch (err) { next(err); }
  };

  getGeneratedAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId) return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
      const from = String(req.query.from || "");
      const to = String(req.query.to || "");
      const rules = req.body?.rules;
      const data = await this.svc.generateAvailability(userId, from, to, rules);
      return ResponseHelper.ok(res, data, HttpResponse.RESOURCE_FOUND);
    } catch (err) { next(err); }
  };
}
