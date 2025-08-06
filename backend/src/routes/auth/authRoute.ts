import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler"; // path as appropriate
import { authController } from "../../dependencies/auth.di";


const router = Router();

router.post("/signup", asyncHandler(authController.signup));
router.post("/verify-otp", asyncHandler(authController.verifyOtp));
router.post("/resend-otp", asyncHandler(authController.resendOtp));


export default router;
