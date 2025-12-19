// dependencies/checkout.di.ts

import { CheckoutController } from "../controllers/Implements/checkout.controller";
import { CheckoutService } from "../services/implements/checkout.service";
import { DoctorPublicRepository } from "../repositories/implements/doctorPublic.repository";

export const checkoutController = new CheckoutController(
  new CheckoutService(new DoctorPublicRepository())
);