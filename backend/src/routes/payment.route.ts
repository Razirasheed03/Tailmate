//routes/payment.route.ts
import { Router } from "express";
import { PaymentController } from "../controllers/Implements/payment.controller";
import { authJwt } from "../middlewares/authJwt";

const router = Router();

// webhook: raw body mount in server.ts for this path
router.post("/webhook", PaymentController.webhook);

// auth routes
router.post("/create-checkout-session", authJwt, PaymentController.createSession);
router.get("/doctor", authJwt, PaymentController.doctorPayments);

export default router;
