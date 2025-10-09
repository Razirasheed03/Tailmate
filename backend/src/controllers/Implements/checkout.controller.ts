// backend/src/controllers/Implements/checkout.controller.ts
import { Request, Response, NextFunction } from "express";
import { HttpStatus } from "../../constants/httpStatus";
import { CheckoutService } from "../../services/implements/checkout.service";

export class CheckoutController {
  constructor(private readonly svc: CheckoutService) {}

  getQuote = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uid = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!uid) return res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
      const payload = req.body || {};
      const data = await this.svc.getQuote(uid, payload);
      return res.status(HttpStatus.OK).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  createCheckout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uid = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!uid) return res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
      const payload = req.body || {};
      const data = await this.svc.createCheckout(uid, payload);
      return res.status(HttpStatus.CREATED).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };
  mockPay = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uid = (req as any).user?._id?.toString() || (req as any).user?.id;
      if (!uid) return res.status(HttpStatus.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
      const bookingId = String(req.body?.bookingId || "").trim();
      if (!bookingId) return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "bookingId is required" });
      const data = await this.svc.mockPay(uid, bookingId);
      return res.status(HttpStatus.OK).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };
}
