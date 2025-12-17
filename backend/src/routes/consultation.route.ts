//consultation.route.ts
import { Router } from "express";
import { authJwt } from "../middlewares/authJwt";
import { asyncHandler } from "../utils/asyncHandler";
import { consultationController } from "../dependencies/consultation.di";

const router = Router();
const c = consultationController;

router.use(authJwt);

// Create consultation
router.post("/", asyncHandler(c.create));

// Get user consultations
router.get("/user/list", asyncHandler(c.getUserConsultations));

// Get doctor consultations
router.get("/doctor/list", asyncHandler(c.getDoctorConsultations));

// Get or create consultation from booking (must be before :id routes)
router.post("/booking/get-or-create", asyncHandler(c.getOrCreateFromBooking));

// Get single consultation
router.get("/:id", asyncHandler(c.getConsultation));

// Prepare call (generate videoRoomId if needed)
router.post("/:id/prepare-call", asyncHandler(c.prepareCall));

// End call
router.post("/:id/end-call", asyncHandler(c.endCall));

// Cancel consultation
router.post("/:id/cancel", asyncHandler(c.cancel));

export default router;
