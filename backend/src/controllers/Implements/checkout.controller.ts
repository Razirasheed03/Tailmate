// controllers/Implements/checkout.controller.ts

import { Request, Response } from "express";
import { ICheckoutService } from "../../services/interfaces/checkout.service.interface";
import { ResponseHelper } from "../../http/ResponseHelper";
import { HttpResponse } from "../../constants/messageConstant";

export class CheckoutController {
  constructor(private checkoutService: ICheckoutService) {}

  getQuote = async (req: Request, res: Response): Promise<Response> => {
    const uid = (req as any)?.user?._id?.toString() || (req as any)?.user?.id;
    if (!uid) {
      return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
    }

    try {
      const result = await this.checkoutService.getQuote(uid, req.body);
      return ResponseHelper.ok(res, result, HttpResponse.RESOURCE_FOUND);
    } catch (e: any) {
      const status = e?.status || 500;
      return ResponseHelper.error(res, status, "QUOTE_ERROR", e?.message || "Failed to get quote");
    }
  };

  createCheckout = async (req: Request, res: Response): Promise<Response> => {
    const uid = (req as any)?.user?._id?.toString() || (req as any)?.user?.id;
    if (!uid) {
      return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
    }

    try {
      const result = await this.checkoutService.createCheckout(uid, req.body);
      return ResponseHelper.ok(res, result, HttpResponse.RESOURCE_UPDATED);
    } catch (e: any) {
      const status = e?.status || 500;
      return ResponseHelper.error(res, status, "CHECKOUT_ERROR", e?.message || "Failed to create checkout");
    }
  };
}