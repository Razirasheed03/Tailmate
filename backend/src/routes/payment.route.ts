// routes/payment.routes.ts
import { Router } from "express";
import { paymentController } from "../dependencies/payment.di";
import { authJwt } from "../middlewares/authJwt";

const router = Router();

// webhook: raw body mount in server.ts for this path
router.post("/webhook", paymentController.webhook);

// auth routes
router.post("/create-checkout-session", authJwt, paymentController.createSession);
router.get("/doctor", authJwt, paymentController.doctorPayments);

export default router;