// backend/src/routes/marketplace.payment.route.ts
import { Router } from "express";
import { authJwt } from "../middlewares/authJwt";
import { MarketplacePaymentController } from "../controllers/Implements/marketplace.payment.controller";

const router = Router();
router.post("/create-checkout-session", authJwt, MarketplacePaymentController.createSession);
export default router;
