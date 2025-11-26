// backend/src/controllers/Implements/marketplace.payment.controller.ts
import { Request, Response } from "express";
import { ResponseHelper } from "../../http/ResponseHelper";
import { HttpResponse } from "../../constants/messageConstant";
import { MarketplacePaymentService } from "../../services/implements/marketplace.payment.service";

const svc = new MarketplacePaymentService();

export const MarketplacePaymentController = {
  createSession: async (req: Request, res: Response) => {
    const uid = (req as any)?.user?._id?.toString() || (req as any)?.user?.id;
    if (!uid) return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
    try {
      const data = await svc.createCheckoutSession(req.body, uid);
      return ResponseHelper.ok(res, data, HttpResponse.RESOURCE_FOUND);
    } catch (err: unknown) {
      const e=err as {message:string}
      return ResponseHelper.badRequest(res, e?.message || "Failed");
    }
  },
};
