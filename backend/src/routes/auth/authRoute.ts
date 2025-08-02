import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler"; // path as appropriate
import { authController } from "../../dependencies/auth.di";

// router setup...
const router = Router();

router.post("/signup", asyncHandler(authController.signup));
router.post("/verify-otp", asyncHandler(authController.verifyOtp));

export default router;
