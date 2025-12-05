// backend/src/routes/doctor.route.ts
import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { authJwt } from "../middlewares/authJwt";
import { requireRole } from "../middlewares/requireRoles";
import { UserRole } from "../constants/roles";
import { doctorController } from "../dependencies/doctor.di";
import { uploadImage, uploadPdf } from "../middlewares/upload";
import { Doctor } from "../schema/doctor.schema";

const router = Router();

router.use(authJwt, requireRole([UserRole.DOCTOR]));

router.get("/me-id", asyncHandler(async (req: any, res) => {
  // user id comes from authJwt middleware
  const userId = req.user?._id?.toString() || req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  // find the doctor document linked to this user; return only its _id
  const doc = await Doctor.findOne({ userId }).select("_id").lean();
  if (!doc) return res.status(404).json({ success: false, message: "Doctor profile not found" });

  return res.json({ success: true, data: { _id: String(doc._id) } });
}));
router.get("/me-user-id", asyncHandler(async (req: any, res) => {
  const userId = req.user?._id?.toString() || req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
  return res.json({ success: true, data: { userId } });
}));

// Verification
router.get("/verification", asyncHandler(doctorController.getVerification));
router.post("/verification/upload", uploadPdf, asyncHandler(doctorController.uploadCertificate));
router.post("/submit-review", asyncHandler(doctorController.submitForReview));
// Profile
router.get("/profile", asyncHandler(doctorController.getProfile));
router.put("/profile", asyncHandler(doctorController.updateProfile));
router.post("/profile/avatar", uploadImage, asyncHandler(doctorController.uploadAvatar));

// Availability (legacy per-day)
router.get("/availability/slots", asyncHandler(doctorController.listDaySlots));
router.post("/availability/save-day", asyncHandler(doctorController.saveDaySchedule));
router.post("/availability/slots", asyncHandler(doctorController.createDaySlot));
router.patch("/availability/slots/:id/status", asyncHandler(doctorController.updateSlotStatus));
router.delete("/availability/slots/:id", asyncHandler(doctorController.deleteDaySlot));

// Sessions
router.get("/sessions", asyncHandler(doctorController.listSessions));
router.get("/sessions/:id", asyncHandler(doctorController.getSession));

// NEW weekly rules + generated availability
router.get("/schedule/rules", asyncHandler(doctorController.getWeeklyRules));
router.post("/schedule/rules", asyncHandler(doctorController.saveWeeklyRules));
router.post("/schedule/availability", asyncHandler(doctorController.getGeneratedAvailability));

router.post("/stripe-onboarding", asyncHandler(doctorController.createStripeOnboarding));

router.post("/payout", asyncHandler(doctorController.requestPayout));
router.get("/payouts", asyncHandler(doctorController.listPayouts));
router.get("/doctorDashboard",asyncHandler(doctorController.doctorDashboard));
router.get("/dashboard/status-chart",asyncHandler(doctorController.getBookingStatusCounts));
router.get("/dashboard/stats", asyncHandler(doctorController.getDashboardStats));
router.get("/dashboard/pet-trends",asyncHandler(doctorController.getPetBookingTrends)
);

export default router;
