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
exports.ConsultationController = void 0;
const ResponseHelper_1 = require("../../http/ResponseHelper");
const messageConstant_1 = require("../../constants/messageConstant");
class ConsultationController {
    constructor(consultationService) {
        this.consultationService = consultationService;
        this.create = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const userId = ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_d = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id) === null || _d === void 0 ? void 0 : _d.toString());
                if (!userId) {
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                }
                const { doctorId } = req.body;
                const consultation = yield this.consultationService.create(userId, doctorId, req.body || {});
                return ResponseHelper_1.ResponseHelper.created(res, consultation, "Consultation created");
            }
            catch (err) {
                next(err);
            }
        });
        this.getConsultation = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const consultation = yield this.consultationService.getConsultation(id);
                return ResponseHelper_1.ResponseHelper.ok(res, consultation, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        this.getUserConsultations = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const userId = ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_d = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id) === null || _d === void 0 ? void 0 : _d.toString());
                if (!userId) {
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                }
                const status = req.query.status || undefined;
                const consultations = yield this.consultationService.getUserConsultations(userId, status);
                return ResponseHelper_1.ResponseHelper.ok(res, consultations, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        this.getDoctorConsultations = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const doctorId = ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.doctorId) === null || _b === void 0 ? void 0 : _b.toString()) || ((_d = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id) === null || _d === void 0 ? void 0 : _d.toString());
                if (!doctorId) {
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                }
                const status = req.query.status || undefined;
                const consultations = yield this.consultationService.getDoctorConsultations(doctorId, status);
                return ResponseHelper_1.ResponseHelper.ok(res, consultations, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        this.prepareCall = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g;
            try {
                const userId = ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_d = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id) === null || _d === void 0 ? void 0 : _d.toString());
                const doctorId = ((_f = (_e = req.user) === null || _e === void 0 ? void 0 : _e.doctorId) === null || _f === void 0 ? void 0 : _f.toString()) || undefined;
                const role = (_g = req.user) === null || _g === void 0 ? void 0 : _g.role;
                if (!userId) {
                    console.error("[prepareCall] No userId in request");
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                }
                const { id } = req.params;
                console.log("[prepareCall] Request from:", {
                    userId,
                    doctorId,
                    role,
                    consultationId: id,
                });
                const result = yield this.consultationService.prepareConsultationCall(id, userId, doctorId, role);
                return ResponseHelper_1.ResponseHelper.ok(res, result, "Call prepared");
            }
            catch (err) {
                console.error("[prepareCall] Error:", err);
                next(err);
            }
        });
        this.endCall = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            try {
                const userId = ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_d = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id) === null || _d === void 0 ? void 0 : _d.toString());
                const doctorId = ((_f = (_e = req.user) === null || _e === void 0 ? void 0 : _e.doctorId) === null || _f === void 0 ? void 0 : _f.toString()) || undefined;
                if (!userId) {
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                }
                const { id } = req.params;
                // Import io from server
                const { io } = require("../../server");
                const consultation = yield this.consultationService.endConsultationCall(id, userId, doctorId, io);
                return ResponseHelper_1.ResponseHelper.ok(res, consultation, "Call ended");
            }
            catch (err) {
                next(err);
            }
        });
        this.cancel = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const userId = ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_d = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id) === null || _d === void 0 ? void 0 : _d.toString());
                if (!userId) {
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                }
                const { id } = req.params;
                const { reason } = req.body;
                const consultation = yield this.consultationService.cancelConsultation(id, userId, reason || "");
                return ResponseHelper_1.ResponseHelper.ok(res, consultation, "Consultation cancelled");
            }
            catch (err) {
                next(err);
            }
        });
        this.cancelByDoctor = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g;
            try {
                const userId = ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_d = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id) === null || _d === void 0 ? void 0 : _d.toString());
                const doctorId = ((_f = (_e = req.user) === null || _e === void 0 ? void 0 : _e.doctorId) === null || _f === void 0 ? void 0 : _f.toString()) || undefined;
                const role = (_g = req.user) === null || _g === void 0 ? void 0 : _g.role;
                if (!userId) {
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                }
                const { id } = req.params;
                const { reason } = req.body;
                const { io } = require("../../server");
                const result = yield this.consultationService.cancelByDoctor(id, userId, doctorId, role, reason || "", io);
                return ResponseHelper_1.ResponseHelper.ok(res, result, "Consultation cancelled by doctor");
            }
            catch (err) {
                next(err);
            }
        });
        this.getOrCreateFromBooking = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const userId = ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_d = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id) === null || _d === void 0 ? void 0 : _d.toString());
                if (!userId) {
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                }
                let { bookingId, doctorId, scheduledFor, durationMinutes } = req.body;
                console.log("[getOrCreateFromBooking] Received:", { bookingId, doctorId, scheduledFor, durationMinutes, userId });
                // Validate required fields with proper checks
                if (!bookingId || bookingId.toString().trim() === "") {
                    return ResponseHelper_1.ResponseHelper.badRequest(res, "bookingId is required");
                }
                if (!doctorId || doctorId.toString().trim() === "") {
                    return ResponseHelper_1.ResponseHelper.badRequest(res, "doctorId is required");
                }
                if (!scheduledFor || scheduledFor.toString().trim() === "") {
                    return ResponseHelper_1.ResponseHelper.badRequest(res, "scheduledFor is required");
                }
                if (durationMinutes === undefined || durationMinutes === null || durationMinutes === "") {
                    return ResponseHelper_1.ResponseHelper.badRequest(res, "durationMinutes is required");
                }
                // Ensure durationMinutes is a number
                durationMinutes = Number(durationMinutes);
                if (isNaN(durationMinutes) || durationMinutes <= 0) {
                    return ResponseHelper_1.ResponseHelper.badRequest(res, "durationMinutes must be a positive number");
                }
                console.log("[getOrCreateFromBooking] Validated:", { bookingId, doctorId, scheduledFor, durationMinutes });
                // CRITICAL FIX: Fetch the booking to get the actual patientId
                // This ensures we use the correct patient ID, not the current user's ID
                // (which could be the doctor if doctor initiates the call)
                const Booking = require("../../schema/booking.schema").Booking;
                const booking = yield Booking.findById(bookingId);
                if (!booking) {
                    return ResponseHelper_1.ResponseHelper.notFound(res, "Booking not found");
                }
                const patientId = booking.patientId.toString();
                console.log("[getOrCreateFromBooking] Fetched booking:", {
                    bookingId,
                    patientId,
                    doctorId: booking.doctorId.toString(),
                    currentUserId: userId
                });
                const consultation = yield this.consultationService.getOrCreateConsultationFromBooking(bookingId, patientId, // Use patientId from booking, not from JWT
                doctorId, scheduledFor, durationMinutes);
                console.log("[getOrCreateFromBooking] Created/Found:", consultation._id);
                return ResponseHelper_1.ResponseHelper.ok(res, consultation, "Consultation retrieved/created");
            }
            catch (err) {
                console.error("[getOrCreateFromBooking] Error:", err);
                next(err);
            }
        });
    }
    // Public getter for DI access (socket layer)
    getService() {
        return this.consultationService;
    }
}
exports.ConsultationController = ConsultationController;
