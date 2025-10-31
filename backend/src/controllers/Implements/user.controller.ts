// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from "express";
import { UserService } from "../../services/implements/user.service";
import { ResponseHelper } from "../../http/ResponseHelper";
import { HttpResponse } from "../../constants/messageConstant";
import { Wallet } from "../../schema/wallet.schema";
import { PaymentModel } from "../../models/implements/payment.model";

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
export async function listMyBookings(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).user?._id?.toString();
    if (!userId) {
      return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
    }

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const scope = String(req.query.scope || "upcoming") as
      | "upcoming"
      | "today"
      | "past"
      | "all";
    const status = req.query.status ? String(req.query.status) : undefined;
    const mode = req.query.mode
      ? (String(req.query.mode) as "video" | "audio" | "inPerson")
      : undefined;
    const q = req.query.q ? String(req.query.q) : undefined;

    const data = await service.listMyBookings(userId, {
      page,
      limit,
      scope,
      status,
      mode,
      q,
    });

    return ResponseHelper.ok(
      res,
      { items: data.items, total: data.total },
      HttpResponse.RESOURCE_FOUND
    );
  } catch (err) {
    return next(err);
  }
}

export async function getMyBooking(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).user?._id?.toString();
    const bookingId = req.params.id;

    if (!userId) {
      return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
    }

    const booking = await service.getMyBookingById(userId, bookingId);

    if (!booking) {
      return ResponseHelper.notFound(res, "Booking not found");
    }

    return ResponseHelper.ok(res, booking, HttpResponse.RESOURCE_FOUND);
  } catch (err) {
    return next(err);
  }
}

export async function cancelMyBooking(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).user?._id?.toString();
    const bookingId = req.params.id;

    if (!userId) {
      return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
    }

    const result = await service.cancelMyBooking(userId, bookingId);

    if (!result.success) {
      return ResponseHelper.badRequest(
        res,
        result.message || "Failed to cancel booking"
      );
    }

    return ResponseHelper.ok(
      res,
      null,
      result.message || "Booking cancelled successfully"
    );
  } catch (err) {
    return next(err);
  }
}

export async function getMyWallet(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any)?.user?._id?.toString();
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const wallet = await Wallet.findOne({ ownerType: "user", ownerId: userId });
    if (!wallet) {
      return res.json({ success: true, data: { currency: "INR", balanceMinor: 0 } });
    }
    res.json({ success: true, data: wallet });
  } catch (err) {
    next(err);
  }
}


export async function getMyWalletTransactions(req:Request, res:Response, next:NextFunction) {
  try {
    const userId = (req as any)?.user?._id?.toString();
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const transactions = await PaymentModel.find({
      patientId: userId,
      paymentStatus: "refunded"
    })
    .sort({ createdAt: -1 })
    .lean();

    res.json({ success: true, data: transactions });
  } catch (err) { next(err); }
}