// src/controllers/implements/admin.controller.ts
import { Request, Response, NextFunction } from "express";
import { IAdminService } from "../../services/interfaces/admin.service.interface";

export class AdminController {
  constructor(private readonly _adminService: IAdminService) {}

  // Existing user endpoints
  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";
      const result = await this._adminService.getAllUsers(page, limit, search);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  blockUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const result = await this._adminService.blockUser(userId);
      res.status(200).json({ success: true, message: result.message });
    } catch (err) { next(err); }
  };

  unblockUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const result = await this._adminService.unblockUser(userId);
      res.status(200).json({ success: true, message: result.message });
    } catch (err) { next(err); }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const result = await this._adminService.deleteUser(userId);
      res.status(200).json({ success: true, message: result.message });
    } catch (err) { next(err); }
  };

  getUserStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this._adminService.getUserStats();
      res.status(200).json({ success: true, data: stats });
    } catch (err) { next(err); }
  };

  // NEW: doctors listing
  listDoctors = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = (req.query.status as string) || "";
      const search = (req.query.search as string) || "";
      const result = await this._adminService.listDoctors(page, limit, status, search);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  // NEW: verify doctor
  verifyDoctor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reviewerId = (req as any).user?._id?.toString();
      const { userId } = req.params;
      const result = await this._adminService.verifyDoctor(userId, reviewerId);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  // NEW: reject doctor
  rejectDoctor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reviewerId = (req as any).user?._id?.toString();
      const { userId } = req.params;
      const { reasons } = req.body as { reasons: string[] };
      const result = await this._adminService.rejectDoctor(userId, reviewerId, reasons || []);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  };
  getDoctorDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params as any;
    const data = await this._adminService.getDoctorDetail(userId);
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
};

}
