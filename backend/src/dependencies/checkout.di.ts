// backend/src/dependencies/checkout.di.ts
import { CheckoutController } from "../controllers/Implements/checkout.controller";
import { CheckoutService } from "../services/implements/checkout.service";

const checkoutService = new CheckoutService();
export const checkoutController = new CheckoutController(checkoutService);
