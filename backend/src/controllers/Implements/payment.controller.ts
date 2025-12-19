// controllers/implements/payment.controller.ts

import { Request, Response } from "express";
import { IPaymentService } from "../../services/interfaces/payment.service.interface";
import { ResponseHelper } from "../../http/ResponseHelper";
import { HttpResponse } from "../../constants/messageConstant";

export class PaymentController {
  constructor(private paymentService: IPaymentService) {}

  createSession = async (req: Request, res: Response): Promise<Response> => {
    const uid = (req as any)?.user?._id?.toString() || (req as any)?.user?.id;
    if (!uid) {
      return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
    }
    
    try {
      const data = await this.paymentService.createCheckoutSession(req.body, uid);
      return ResponseHelper.ok(res, data, HttpResponse.RESOURCE_FOUND);
    } catch (e: any) {
      return ResponseHelper.badRequest(res, e?.message || "Failed");
    }
  };

  webhook = async (req: Request, res: Response): Promise<Response> => {
    try {
      await this.paymentService.processWebhook(req);
      return ResponseHelper.ok(
        res, 
        { received: true }, 
        HttpResponse.RESOURCE_UPDATED
      );
    } catch (err: any) {
      return ResponseHelper.error(
        res, 
        400, 
        "WEBHOOK_ERROR", 
        `Webhook error: ${err?.message || "Unknown error"}`
      );
    }
  };

  doctorPayments = async (req: Request, res: Response): Promise<Response> => {
    const did = (req as any)?.user?._id?.toString() || (req as any)?.user?.id;
    if (!did) {
      return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const order = (req.query.order as 'asc' | 'desc') || 'desc';

    const result = await this.paymentService.doctorPayments(did, {
      page,
      limit,
      sortBy,
      order
    });

    return ResponseHelper.ok(res, result, HttpResponse.RESOURCE_FOUND);
  };
}