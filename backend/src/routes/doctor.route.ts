import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { authJwt } from "../middlewares/authJwt";
import { requireRole } from "../middlewares/requireRoles";
import { UserRole } from "../constants/roles";
import { doctorController } from "../dependencies/doctor.di";
import { uploadImage, uploadPdf } from "../middlewares/upload";

const router = Router();

// guards first
router.use(authJwt, requireRole([UserRole.DOCTOR]));

// GET current verification status
router.get("/verification", asyncHandler(doctorController.getVerification));

// POST PDF upload (multipart) -> Cloudinary -> save url -> pending
router.post("/verification/upload", uploadPdf, asyncHandler(doctorController.uploadCertificate));

// profile (verified-only)
router.get("/profile", asyncHandler(doctorController.getProfile));
router.put("/profile", asyncHandler(doctorController.updateProfile));
router.post("/profile/avatar", uploadImage, asyncHandler(doctorController.uploadAvatar));

export default router;
