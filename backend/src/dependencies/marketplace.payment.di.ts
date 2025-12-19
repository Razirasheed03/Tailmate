import { MarketplacePaymentController } from "../controllers/Implements/marketplace.payment.controller";
import { MarketplacePaymentService } from "../services/implements/marketplace.payment.service";

export const marketplacePaymentController = new MarketplacePaymentController(
  new MarketplacePaymentService()
);
