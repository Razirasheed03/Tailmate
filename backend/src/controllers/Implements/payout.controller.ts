import { Request, Response, NextFunction } from "express";
import { ResponseHelper } from "../../http/ResponseHelper";
import { HttpResponse } from "../../constants/messageConstant";
import { IPayoutService } from "../../services/interfaces/payout.service.interface";


export class PayoutController {
  constructor(private readonly payoutService: IPayoutService) {}

  requestPayout = async (req: Request, res: Response, next: NextFunction) => {
    const uid = (req as any)?.user?._id?.toString() || (req as any)?.user?.id;
    if (!uid) return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
    
    try {
      // Use request body safely
      const { ownerType = "user", amount, currency = "INR" } = typeof req.body === "object" ? req.body : {};
      if (!ownerType || !amount) return ResponseHelper.badRequest(res, "Missing ownerType or amount");

      // All payouts initiated by logged-in user for themself
      const payout = await this.payoutService.requestPayout(ownerType, uid, amount, currency);

      return ResponseHelper.ok(
        res,
        payout,
        HttpResponse.RESOURCE_FOUND
      );
    } catch (err: any) {
      return ResponseHelper.badRequest(res, err?.message || "Failed to create payout");
    }
  };

  listMyPayouts = async (req: Request, res: Response, next: NextFunction) => {
    const uid = (req as any)?.user?._id?.toString() || (req as any)?.user?.id;
    if (!uid) return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);

    try {
      const ownerType = typeof req.query.ownerType === "string" ? req.query.ownerType : "user";
      const rows = await this.payoutService.listPayouts(ownerType, uid);

      return ResponseHelper.ok(
        res,
        rows,
        HttpResponse.RESOURCE_FOUND
      );
    } catch (err: any) {
      return ResponseHelper.badRequest(res, err?.message || "Failed to list payouts");
    }
  };
}
