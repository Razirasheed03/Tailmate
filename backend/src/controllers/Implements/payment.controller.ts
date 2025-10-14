// backend/src/controllers/Implements/payment.controller.ts
import { Request, Response } from "express";
import { PaymentService } from "../../services/implements/payment.service";
import { ResponseHelper } from "../../http/ResponseHelper";
import { HttpResponse } from "../../constants/messageConstant";

const svc = new PaymentService();

export const PaymentController = {
  createSession: async (req: Request, res: Response) => {
    const uid = (req as any)?.user?._id?.toString() || (req as any)?.user?.id;
    if (!uid) return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
    try {
      const data = await svc.createCheckoutSession(req.body, uid);
      return ResponseHelper.ok(res, data, HttpResponse.RESOURCE_FOUND);
    } catch (e: any) {
      return ResponseHelper.badRequest(res, e?.message || "Failed");
    }
  },

  webhook: async (req: Request, res: Response) => {
    try {
      await svc.processWebhook(req);
      return ResponseHelper.ok(res, { received: true }, HttpResponse.RESOURCE_UPDATED);
    } catch (err: any) {
      return ResponseHelper.error(res, 400, "WEBHOOK_ERROR", `Webhook error: ${err?.message || "Unknown error"}`);
    }
  },

  doctorPayments: async (req: Request, res: Response) => {
    const did = (req as any)?.user?._id?.toString() || (req as any)?.user?.id;
    if (!did) return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
    const data = await svc.doctorPayments(did);
    return ResponseHelper.ok(res, data, HttpResponse.RESOURCE_FOUND);
  },
};
