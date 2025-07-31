//////router layer

import { Router } from "express";
import { authController } from "../../dependencies/auth.di";

const router = Router();

router.post("/signup", authController.signup);
router.post("/verify-otp", authController.verifyOtp);

export default router;
