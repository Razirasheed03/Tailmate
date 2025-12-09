"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//consultation.route.ts
const express_1 = require("express");
const authJwt_1 = require("../middlewares/authJwt");
const asyncHandler_1 = require("../utils/asyncHandler");
const consultation_controller_1 = require("../controllers/Implements/consultation.controller");
const router = (0, express_1.Router)();
const c = new consultation_controller_1.ConsultationController();
router.use(authJwt_1.authJwt);
// Create consultation
router.post("/", (0, asyncHandler_1.asyncHandler)(c.create));
// Get user consultations
router.get("/user/list", (0, asyncHandler_1.asyncHandler)(c.getUserConsultations));
// Get doctor consultations
router.get("/doctor/list", (0, asyncHandler_1.asyncHandler)(c.getDoctorConsultations));
// Get or create consultation from booking (must be before :id routes)
router.post("/booking/get-or-create", (0, asyncHandler_1.asyncHandler)(c.getOrCreateFromBooking));
// Get single consultation
router.get("/:id", (0, asyncHandler_1.asyncHandler)(c.getConsultation));
// Prepare call (generate videoRoomId if needed)
router.post("/:id/prepare-call", (0, asyncHandler_1.asyncHandler)(c.prepareCall));
// End call
router.post("/:id/end-call", (0, asyncHandler_1.asyncHandler)(c.endCall));
// Cancel consultation
router.post("/:id/cancel", (0, asyncHandler_1.asyncHandler)(c.cancel));
exports.default = router;
