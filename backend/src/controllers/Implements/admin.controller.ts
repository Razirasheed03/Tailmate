// src/controllers/implements/admin.controller.ts
import { Request, Response, NextFunction } from "express";
import { IAdminService } from "../../services/interfaces/admin.service.interface";
import { ResponseHelper } from "../../http/ResponseHelper";
import { HttpResponse } from "../../constants/messageConstant";
import { Types } from "mongoose";
interface AuthenticatedRequest extends Request {
  user?: {
    _id: Types.ObjectId;
    email?: string;
    username?: string;
    // add other user properties as needed
  };
}
export class AdminController {
  constructor(private readonly _adminService: IAdminService) {}

  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";
      const result = await this._adminService.getAllUsers(page, limit, search);
      return ResponseHelper.ok(res, result, HttpResponse.RESOURCE_FOUND);
    } catch (err) {
      next(err);
    }
  };

  blockUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const result = await this._adminService.blockUser(userId);
      // result is { message: "User blocked successfully" } per service
      return ResponseHelper.ok(res, result, HttpResponse.RESOURCE_UPDATED);
    } catch (err) {
      next(err);
    }
  };

  unblockUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const result = await this._adminService.unblockUser(userId);
      return ResponseHelper.ok(res, result, HttpResponse.RESOURCE_UPDATED);
    } catch (err) {
      next(err);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const result = await this._adminService.deleteUser(userId);
      // Consistent 200 with message payload; alternatively could return 204
      return ResponseHelper.ok(res, result, HttpResponse.RESOURCE_UPDATED);
    } catch (err) {
      next(err);
    }
  };

  getUserStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this._adminService.getUserStats();
      return ResponseHelper.ok(res, stats, HttpResponse.RESOURCE_FOUND);
    } catch (err) {
      next(err);
    }
  };
    getAdminEarnings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this._adminService.getEarningsByDoctor();
      return ResponseHelper.ok(res, data, HttpResponse.RESOURCE_FOUND);
    } catch (err) {
      next(err);
    }
  }

  // Doctors
 verifyDoctor = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const reviewerId = req.user?._id?.toString();
    if (!reviewerId) {
      return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
    }
    const { userId } = req.params;
    const result = await this._adminService.verifyDoctor(userId, reviewerId);
    return ResponseHelper.ok(res, result, HttpResponse.RESOURCE_UPDATED);
  } catch (err) {
    next(err);
  }
};

rejectDoctor = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const reviewerId = req.user?._id?.toString();
    if (!reviewerId) {
      return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
    }
    const { userId } = req.params;
    const { reasons } = req.body as { reasons: string[] };
    const result = await this._adminService.rejectDoctor(
      userId,
      reviewerId,
      reasons || []
    );
    return ResponseHelper.ok(res, result, HttpResponse.RESOURCE_UPDATED);
  } catch (err) {
    next(err);
  }
};

getDoctorDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { userId } = req.params;
    const data = await this._adminService.getDoctorDetail(userId);
    if (!data) {
      return ResponseHelper.notFound(res, HttpResponse.PAGE_NOT_FOUND);
    }
    return ResponseHelper.ok(res, data, HttpResponse.RESOURCE_FOUND);
  } catch (err) {
    next(err);
  }
};

listDoctors = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { page, limit, status, search } = req.query;
    const result = await this._adminService.listDoctors(
      Number(page),
      Number(limit),
      status as string,
      search as string
    );
    return ResponseHelper.ok(res, result, HttpResponse.RESOURCE_FOUND);
  } catch (err) {
    next(err);
  }
};

  // Pet Categories
  listPetCategories = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";
      const active = (req.query.active as string) || "";
      const result = await this._adminService.listPetCategories(
        page,
        limit,
        search,
        active
      );
      return ResponseHelper.ok(res, result, HttpResponse.RESOURCE_FOUND);
    } catch (err) {
      next(err);
    }
  };

  createPetCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const payload = req.body || {};
      const cat = await this._adminService.createPetCategory(payload);
      return ResponseHelper.created(res, cat, HttpResponse.RESOURCE_FOUND);
    } catch (err: any) {
      // Duplicate name handled by service or DB; map to 409
      if (
        err?.status === 409 ||
        err?.code === 11000 ||
        String(err?.message || "").includes("duplicate key")
      ) {
        return ResponseHelper.conflict(
          res,
          "Category name already exists (case-insensitive)"
        );
      }
      return next(err);
    }
  };

  updatePetCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = req.params.id;
      const payload = req.body || {};
      const cat = await this._adminService.updatePetCategory(id, payload);
      if (!cat)
        return ResponseHelper.notFound(res, HttpResponse.PAGE_NOT_FOUND);
      return ResponseHelper.ok(res, cat, HttpResponse.RESOURCE_UPDATED);
    } catch (err: any) {
      if (
        err?.status === 409 ||
        err?.code === 11000 ||
        String(err?.message || "").includes("duplicate key")
      ) {
        return ResponseHelper.conflict(
          res,
          "Category name already exists (case-insensitive)"
        );
      }
      return next(err);
    }
  };

  deletePetCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = req.params.id;
      const ok = await this._adminService.deletePetCategory(id);
      if (!ok) return ResponseHelper.notFound(res, HttpResponse.PAGE_NOT_FOUND);
      return ResponseHelper.noContent(res);
    } catch (err) {
      next(err);
    }
  };
}
