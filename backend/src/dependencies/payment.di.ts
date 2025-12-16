// dependencies/payment.di.ts

import { PaymentController } from "../controllers/Implements/payment.controller";
import { PaymentRepository } from "../repositories/implements/payment.repository";
import { PaymentService } from "../services/implements/payment.service";

export const paymentController = new PaymentController(
  new PaymentService(new PaymentRepository())
);