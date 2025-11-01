import { Request, Response, NextFunction } from "express";
import { PayoutService } from "../../services/implements/payout.service";
import { ResponseHelper } from "../../http/ResponseHelper";
import { HttpResponse } from "../../constants/messageConstant";

const svc = new PayoutService();

// POST /payout/request
export async function requestPayout(req: Request, res: Response, next: NextFunction) {
  const uid = (req as any)?.user?._id?.toString() || (req as any)?.user?.id;
  if (!uid) return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);

  try {
    // Use request body safely
    const { ownerType = "user", amount, currency = "INR" } = typeof req.body === "object" ? req.body : {};
    if (!ownerType || !amount) return ResponseHelper.badRequest(res, "Missing ownerType or amount");

    // All payouts initiated by logged-in user for themself
    const payout = await svc.requestPayout(ownerType, uid, amount, currency);

    return ResponseHelper.ok(
      res,
      payout,
      HttpResponse.RESOURCE_FOUND
    );
  } catch (err: any) {
    return ResponseHelper.badRequest(res, err?.message || "Failed to create payout");
  }
}

// GET /payout/history (optionally ?ownerType=user|doctor query)
export async function listMyPayouts(req: Request, res: Response, next: NextFunction) {
  const uid = (req as any)?.user?._id?.toString() || (req as any)?.user?.id;
  if (!uid) return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);

  try {
    const ownerType = typeof req.query.ownerType === "string" ? req.query.ownerType : "user";
    const rows = await svc.listPayouts(ownerType, uid);

    return ResponseHelper.ok(
      res,
      rows,
      HttpResponse.RESOURCE_FOUND
    );
  } catch (err: any) {
    return ResponseHelper.badRequest(res, err?.message || "Failed to list payouts");
  }
}
