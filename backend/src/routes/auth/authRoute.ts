import { Router } from "express";
import { authController } from "../../dependencies/auth.di";

const router = Router();

router.post("/signup", authController.signup);

export default router;
