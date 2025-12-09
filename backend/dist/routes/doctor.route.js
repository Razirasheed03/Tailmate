"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/doctor.route.ts
const express_1 = require("express");
const asyncHandler_1 = require("../utils/asyncHandler");
const authJwt_1 = require("../middlewares/authJwt");
const requireRoles_1 = require("../middlewares/requireRoles");
const roles_1 = require("../constants/roles");
const doctor_di_1 = require("../dependencies/doctor.di");
const upload_1 = require("../middlewares/upload");
const doctor_schema_1 = require("../schema/doctor.schema");
const router = (0, express_1.Router)();
router.use(authJwt_1.authJwt, (0, requireRoles_1.requireRole)([roles_1.UserRole.DOCTOR]));
router.get("/me-id", (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // user id comes from authJwt middleware
    const userId = ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = req.user) === null || _c === void 0 ? void 0 : _c.id);
    if (!userId)
        return res.status(401).json({ success: false, message: "Unauthorized" });
    // find the doctor document linked to this user; return only its _id
    const doc = yield doctor_schema_1.Doctor.findOne({ userId }).select("_id").lean();
    if (!doc)
        return res.status(404).json({ success: false, message: "Doctor profile not found" });
    return res.json({ success: true, data: { _id: String(doc._id) } });
})));
router.get("/me-user-id", (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const userId = ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = req.user) === null || _c === void 0 ? void 0 : _c.id);
    if (!userId)
        return res.status(401).json({ success: false, message: "Unauthorized" });
    return res.json({ success: true, data: { userId } });
})));
// Verification
router.get("/verification", (0, asyncHandler_1.asyncHandler)(doctor_di_1.doctorController.getVerification));
router.post("/verification/upload", upload_1.uploadPdf, (0, asyncHandler_1.asyncHandler)(doctor_di_1.doctorController.uploadCertificate));
router.post("/submit-review", (0, asyncHandler_1.asyncHandler)(doctor_di_1.doctorController.submitForReview));
// Profile
router.get("/profile", (0, asyncHandler_1.asyncHandler)(doctor_di_1.doctorController.getProfile));
router.put("/profile", (0, asyncHandler_1.asyncHandler)(doctor_di_1.doctorController.updateProfile));
router.post("/profile/avatar", upload_1.uploadImage, (0, asyncHandler_1.asyncHandler)(doctor_di_1.doctorController.uploadAvatar));
// Availability (legacy per-day)
router.get("/availability/slots", (0, asyncHandler_1.asyncHandler)(doctor_di_1.doctorController.listDaySlots));
router.post("/availability/save-day", (0, asyncHandler_1.asyncHandler)(doctor_di_1.doctorController.saveDaySchedule));
router.post("/availability/slots", (0, asyncHandler_1.asyncHandler)(doctor_di_1.doctorController.createDaySlot));
router.patch("/availability/slots/:id/status", (0, asyncHandler_1.asyncHandler)(doctor_di_1.doctorController.updateSlotStatus));
router.delete("/availability/slots/:id", (0, asyncHandler_1.asyncHandler)(doctor_di_1.doctorController.deleteDaySlot));
// Sessions
router.get("/sessions", (0, asyncHandler_1.asyncHandler)(doctor_di_1.doctorController.listSessions));
router.get("/sessions/:id", (0, asyncHandler_1.asyncHandler)(doctor_di_1.doctorController.getSession));
// NEW weekly rules + generated availability
router.get("/schedule/rules", (0, asyncHandler_1.asyncHandler)(doctor_di_1.doctorController.getWeeklyRules));
router.post("/schedule/rules", (0, asyncHandler_1.asyncHandler)(doctor_di_1.doctorController.saveWeeklyRules));
router.post("/schedule/availability", (0, asyncHandler_1.asyncHandler)(doctor_di_1.doctorController.getGeneratedAvailability));
router.post("/stripe-onboarding", (0, asyncHandler_1.asyncHandler)(doctor_di_1.doctorController.createStripeOnboarding));
router.post("/payout", (0, asyncHandler_1.asyncHandler)(doctor_di_1.doctorController.requestPayout));
router.get("/payouts", (0, asyncHandler_1.asyncHandler)(doctor_di_1.doctorController.listPayouts));
router.get("/doctorDashboard", (0, asyncHandler_1.asyncHandler)(doctor_di_1.doctorController.doctorDashboard));
router.get("/dashboard/status-chart", (0, asyncHandler_1.asyncHandler)(doctor_di_1.doctorController.getBookingStatusCounts));
router.get("/dashboard/stats", (0, asyncHandler_1.asyncHandler)(doctor_di_1.doctorController.getDashboardStats));
router.get("/dashboard/pet-trends", (0, asyncHandler_1.asyncHandler)(doctor_di_1.doctorController.getPetBookingTrends));
exports.default = router;
