// backend/src/routes/doctor.routes.ts
import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { authJwt } from "../middlewares/authJwt";
import { requireRole } from "../middlewares/requireRoles";
import { UserRole } from "../constants/roles";
import { doctorController } from "../dependencies/doctor.di";
import { uploadImage, uploadPdf } from "../middlewares/upload";

const router = Router();

router.use(authJwt, requireRole([UserRole.DOCTOR]));

// Verification
router.get("/verification", asyncHandler(doctorController.getVerification));
router.post("/verification/upload", uploadPdf, asyncHandler(doctorController.uploadCertificate));

// Profile
router.get("/profile", asyncHandler(doctorController.getProfile));
router.put("/profile", asyncHandler(doctorController.updateProfile));
router.post("/profile/avatar", uploadImage, asyncHandler(doctorController.uploadAvatar));

// Availability
router.get("/availability/slots", asyncHandler(doctorController.listDaySlots));              // ?date=YYYY-MM-DD
router.post("/availability/save-day", asyncHandler(doctorController.saveDaySchedule));      // { date, slots[] }
router.post("/availability/slots", asyncHandler(doctorController.createDaySlot));           // one slot
router.patch("/availability/slots/:id/status", asyncHandler(doctorController.updateSlotStatus));
router.delete("/availability/slots/:id", asyncHandler(doctorController.deleteDaySlot));

// NEW: Sessions (bookings) for this doctor
router.get("/sessions", asyncHandler(doctorController.listSessions));           // ?page&limit&scope&mode&q
router.get("/sessions/:id", asyncHandler(doctorController.getSession));         // detail

export default router;
