// backend/src/controllers/Implements/doctor.controller.ts
import { Request, Response, NextFunction } from "express";
import { DoctorService } from "../../services/implements/doctor.service";
import {
  uploadImageBufferToCloudinary,
  uploadPdfBufferToCloudinary,
} from "../../utils/uploadToCloudinary";
import { HttpStatus } from "../../constants/httpStatus";

export class DoctorController {
  constructor(private readonly svc: DoctorService) {}

  getVerification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId) return res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
      const data = await this.svc.getVerification(userId);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (err) { next(err); }
  };

  uploadCertificate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId) return res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });

      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "No file uploaded" });

      const { secure_url } = await uploadPdfBufferToCloudinary(file.buffer, file.originalname);
      const updated = await this.svc.submitCertificate(userId, secure_url);
      return res.status(HttpStatus.OK).json({
        success: true,
        data: { certificateUrl: secure_url, verification: updated.verification },
        message: "Certificate uploaded and submitted for review",
      });
    } catch (err) { next(err); }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId) return res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
      const data = await this.svc.getProfile(userId);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (err: any) {
      const status = (err && err.status) || HttpStatus.INTERNAL_SERVER_ERROR;
      res.status(status).json({ success: false, message: err?.message || "Failed to fetch profile" });
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId) return res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
      const payload = req.body || {};
      const data = await this.svc.updateProfile(userId, payload);
      res.status(HttpStatus.OK).json({ success: true, data, message: "Profile updated" });
    } catch (err: any) {
      const status = (err && err.status) || HttpStatus.BAD_REQUEST;
      res.status(status).json({ success: false, message: err?.message || "Failed to update profile" });
    }
  };

  uploadAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId) return res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });

      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "No image uploaded" });

      const { secure_url } = await uploadImageBufferToCloudinary(file.buffer, file.originalname);
      return res.status(HttpStatus.OK).json({ success: true, data: { avatarUrl: secure_url } });
    } catch (err) { next(err); }
  };

  listDaySlots = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      const date = String(req.query.date || "");
      if (!date) return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "date is required" });
      const data = await this.svc.listDaySlots(userId, date);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (err) { next(err); }
  };

  saveDaySchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      const { date, slots } = req.body || {};
      if (!date || !Array.isArray(slots)) return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "date and slots are required" });
      const data = await this.svc.saveDaySchedule(userId, { date, slots });
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (err) { next(err); }
  };

  createDaySlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      const data = await this.svc.createDaySlot(userId, req.body);
      res.status(HttpStatus.CREATED).json({ success: true, data });
    } catch (err) { next(err); }
  };

  updateSlotStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      const { status } = req.body || {};
      if (status !== "available" && status !== "booked")
        return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "invalid status" });
      const data = await this.svc.updateSlotStatus(userId, req.params.id, status);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (err) { next(err); }
  };

  deleteDaySlot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      const ok = await this.svc.deleteDaySlot(userId, req.params.id);
      res.status(HttpStatus.OK).json({ success: true, data: { deleted: ok } });
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
      return res.status(HttpStatus.OK).json({ success: true, data: { items: data.items, total: data.total } });
    } catch (err) { next(err); }
  };

  getSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doctorId = (req as any).user?._id?.toString() || (req as any).user?.id;
      const id = String(req.params.id);
      const row = await this.svc.getSession(doctorId, id);
      if (!row) return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: "Not found" });
      return res.status(HttpStatus.OK).json({ success: true, data: row });
    } catch (err) { next(err); }
  };

  // NEW weekly schedule
  getWeeklyRules = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId) return res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
      const data = await this.svc.getWeeklyRules(userId);
      return res.status(HttpStatus.OK).json({ success: true, data });
    } catch (err) { next(err); }
  };

  saveWeeklyRules = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId) return res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
      const data = await this.svc.saveWeeklyRules(userId, req.body?.rules || []);
      return res.status(HttpStatus.OK).json({ success: true, data });
    } catch (err) { next(err); }
  };

  getGeneratedAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!userId) return res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
      const from = String(req.query.from || "");
      const to = String(req.query.to || "");
      const rules = req.body?.rules;
      const data = await this.svc.generateAvailability(userId, from, to, rules);
      return res.status(HttpStatus.OK).json({ success: true, data });
    } catch (err) { next(err); }
  };
}
