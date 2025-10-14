// backend/src/controllers/Implements/checkout.controller.ts
import { Request, Response, NextFunction } from "express";
import { CheckoutService } from "../../services/implements/checkout.service";
import { ResponseHelper } from "../../http/ResponseHelper";
import { HttpResponse } from "../../constants/messageConstant";

export class CheckoutController {
  constructor(private readonly svc: CheckoutService) {}

  getQuote = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uid = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!uid) {
        return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
      }
      const payload = req.body || {};
      const data = await this.svc.getQuote(uid, payload);
      // Frontend expects { success, data: QuoteResponse }
      return ResponseHelper.ok(res, data, HttpResponse.RESOURCE_FOUND);
    } catch (err) {
      next(err);
    }
  };

  createCheckout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uid = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!uid) {
        return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
      }
      const payload = req.body || {};
      const data = await this.svc.createCheckout(uid, payload);
      // Frontend expects { success, data: { bookingId, redirectUrl? } }
      return ResponseHelper.created(res, data, HttpResponse.RESOURCE_FOUND);
    } catch (err) {
      next(err);
    }
  };


}
