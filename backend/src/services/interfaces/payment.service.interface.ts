// services/interfaces/payment.service.interface.ts

import { Request } from "express";
import { PaginatedResult } from "../../repositories/interfaces/payment.repository.interface";
import { IPayment } from "../../models/implements/payment.model";

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "asc" | "desc";
}

export type CreateCheckoutSessionResponse = {
  url: string | null;
};

export type WebhookProcessResult =
  | {
      handled: true;
      type: "checkout.session.completed";
      paymentId?: string;
    }
  | {
      handled: false;
      type: string;
    };

export interface IPaymentService {
  createCheckoutSession(
    payload: { bookingId: string },
    userId: string
  ): Promise<CreateCheckoutSessionResponse>;

  processWebhook(req: Request): Promise<WebhookProcessResult>;

  doctorPayments(
    doctorId: string,
    query?: PaginationQuery
  ): Promise<PaginatedResult<IPayment>>;
}
