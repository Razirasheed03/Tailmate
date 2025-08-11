import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler"; // path as appropriate
import { authController } from "../../dependencies/auth.di";


const router = Router();

router.post("/signup", asyncHandler(authController.signup));
router.post("/verify-otp", asyncHandler(authController.verifyOtp));
router.post("/resend-otp", asyncHandler(authController.resendOtp));
router.post("/login", asyncHandler(authController.login));
router.post("/auth/forgot-password", authController.forgotPassword);
router.post("/auth/reset-password", authController.resetPassword);


export default router;
