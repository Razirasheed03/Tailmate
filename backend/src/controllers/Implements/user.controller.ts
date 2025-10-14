// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from "express";
import { UserService } from "../../services/implements/user.service";
import { ResponseHelper } from "../../http/ResponseHelper";
import { HttpResponse } from "../../constants/messageConstant";

const service = new UserService();

export async function updateMyProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const uid = (req as any).user?._id?.toString();
    if (!uid)
      return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);

    const { username } = req.body || {};
    if (!username) {
      return ResponseHelper.badRequest(res, "username is required");
    }

    const user = await service.updateMyUsername(uid, username);
    return ResponseHelper.ok(
      res,
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      HttpResponse.RESOURCE_UPDATED
    );
  } catch (err: any) {
    if (err?.code === 11000) {
      return ResponseHelper.conflict(res, HttpResponse.USERNAME_EXIST);
    }
    if (err?.name === "ValidationError") {
      return ResponseHelper.badRequest(res, err.message);
    }
    return next(err);
  }
}

export async function listDoctors(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const search = String(req.query.search || "");
    const specialty = String(req.query.specialty || "");
    const result = await service.listDoctorsWithNextSlot({
      page,
      limit,
      search,
      specialty,
    });
    // Keep the expected client shape: { items, total }
    return ResponseHelper.ok(
      res,
      { items: result.items, total: result.total },
      HttpResponse.RESOURCE_FOUND
    );
  } catch (err) {
    return next(err);
  }
}

export async function getVetDetail(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return ResponseHelper.badRequest(res, "id is required");
    const data = await service.getDoctorPublicById(id);
    if (!data) return ResponseHelper.notFound(res, "Doctor not found");
    return ResponseHelper.ok(res, data, HttpResponse.RESOURCE_FOUND);
  } catch (err) {
    return next(err);
  }
}

export async function getVetSlots(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id = String(req.params.id || "").trim();
    const from = String(req.query.from || "").trim();
    const to = String(req.query.to || "").trim();
    if (!id || !from || !to) {
      return ResponseHelper.badRequest(res, "id, from and to are required");
    }
    const data = await service.listDoctorGeneratedAvailability(id, {
      from,
      to,
    });
    return ResponseHelper.ok(res, data, HttpResponse.RESOURCE_FOUND);
  } catch (err) {
    return next(err);
  }
}
