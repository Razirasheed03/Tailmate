// backend/src/routes/marketplace.payment.route.ts
import { Router } from "express";
import { authJwt } from "../middlewares/authJwt";
import { asyncHandler } from "../utils/asyncHandler";
import { marketplacePaymentController } from "../dependencies/marketplace.payment.di";

const router = Router();
router.post("/create-checkout-session", authJwt, asyncHandler((req, res, next) => marketplacePaymentController.createSession(req, res)));
export default router;
