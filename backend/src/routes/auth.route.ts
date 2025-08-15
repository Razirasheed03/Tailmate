// src/routes/authRoutes.ts
import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { authController } from "../dependencies/auth.di";

const router = Router();

router.post("/signup", asyncHandler(authController.signup));
router.post("/verify-otp", asyncHandler(authController.verifyOtp));
router.post("/resend-otp", asyncHandler(authController.resendOtp));
router.post("/login", asyncHandler(authController.login));
router.post("/forgot-password", asyncHandler(authController.forgotPassword));
router.post("/reset-password", asyncHandler(authController.resetPassword));

export default router;
