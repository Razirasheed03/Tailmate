// src/controllers/implements/admin.controller.ts
import { Request, Response, NextFunction } from "express";
import { IAdminService } from "../../services/interfaces/admin.service.interface";
import { HttpStatus } from "../../constants/httpStatus";

export class AdminController {
  constructor(private readonly _adminService: IAdminService) {}

  // Existing user endpoints
  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";
      const result = await this._adminService.getAllUsers(page, limit, search);
      res.status(HttpStatus.OK).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  blockUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const result = await this._adminService.blockUser(userId);
      res.status(HttpStatus.OK).json({ success: true, message: result.message });
    } catch (err) { next(err); }
  };

  unblockUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const result = await this._adminService.unblockUser(userId);
      res.status(HttpStatus.OK).json({ success: true, message: result.message });
    } catch (err) { next(err); }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const result = await this._adminService.deleteUser(userId);
      res.status(HttpStatus.OK).json({ success: true, message: result.message });
    } catch (err) { next(err); }
  };

  getUserStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this._adminService.getUserStats();
      res.status(HttpStatus.OK).json({ success: true, data: stats });
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
      res.status(HttpStatus.OK).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  // NEW: verify doctor
  verifyDoctor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reviewerId = (req as any).user?._id?.toString();
      const { userId } = req.params;
      const result = await this._adminService.verifyDoctor(userId, reviewerId);
      res.status(HttpStatus.OK).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  // NEW: reject doctor
  rejectDoctor = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reviewerId = (req as any).user?._id?.toString();
      const { userId } = req.params;
      const { reasons } = req.body as { reasons: string[] };
      const result = await this._adminService.rejectDoctor(userId, reviewerId, reasons || []);
      res.status(HttpStatus.OK).json({ success: true, data: result });
    } catch (err) { next(err); }
  };
  getDoctorDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params as any;
    const data = await this._adminService.getDoctorDetail(userId);
    res.status(HttpStatus.OK).json({ success: true, data });
  } catch (err) { next(err); }
};
 listPetCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || '';
      const active = (req.query.active as string) || '';
      const result = await this._adminService.listPetCategories(page, limit, search, active);
      res.status(HttpStatus.OK).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  createPetCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = req.body || {};
      const cat = await this._adminService.createPetCategory(payload);
      res.status(HttpStatus.CREATED).json({ success: true, data: cat });
    } catch (err) { next(err); }
  };

  updatePetCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const payload = req.body || {};
      const cat = await this._adminService.updatePetCategory(id, payload);
      if (!cat) return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Not found' });
      res.status(HttpStatus.OK).json({ success: true, data: cat });
    } catch (err) { next(err); }
  };
  deletePetCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const ok = await this._adminService.deletePetCategory(id);
    if (!ok) return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Not found' });
    return res.status(HttpStatus.NO_CONTENT).send();
  } catch (err) { next(err); }
};

}
