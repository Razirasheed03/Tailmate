import { PayoutController } from "../controllers/Implements/payout.controller";
import { PayoutService } from "../services/implements/payout.service";

export const payoutController = new PayoutController(
  new PayoutService()
);
