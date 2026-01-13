"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.ConsultationService = void 0;
// services/implements/consultation.service.ts
const mongoose_1 = __importStar(require("mongoose"));
const doctor_schema_1 = require("../../schema/doctor.schema");
const booking_schema_1 = require("../../schema/booking.schema");
const payment_model_1 = require("../../models/implements/payment.model");
const wallet_schema_1 = require("../../schema/wallet.schema");
const walletHistory_schema_1 = require("../../schema/walletHistory.schema");
const notification_schema_1 = require("../../schema/notification.schema");
const consultation_schema_1 = require("../../schema/consultation.schema");
// Helper function to safely extract ObjectId string from populated or non-populated field
const extractObjectIdString = (field) => {
    if (!field)
        return "";
    // If it's already a string
    if (typeof field === "string")
        return field;
    // If it's a Mongoose ObjectId
    if (field instanceof mongoose_1.Types.ObjectId)
        return field.toString();
    // If it's a populated object with _id
    if (typeof field === "object" && field._id) {
        return field._id instanceof mongoose_1.Types.ObjectId
            ? field._id.toString()
            : String(field._id);
    }
    // Fallback: try toString (may return [object Object] if not handled above)
    return String(field);
};
const generateVideoRoomId = (repo) => __awaiter(void 0, void 0, void 0, function* () {
    const chars = "1234567890abcdefghijklmnopqrstuvwxyz";
    let attempts = 0;
    const maxAttempts = 10;
    while (attempts < maxAttempts) {
        let result = "";
        for (let i = 0; i < 12; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const videoRoomId = `room_${result}`;
        const existing = yield repo.findByVideoRoomId(videoRoomId);
        if (!existing) {
            return videoRoomId;
        }
        attempts++;
    }
    throw new Error("Failed to generate unique videoRoomId");
});
class ConsultationService {
    constructor(_repo, _bookingRepo) {
        this._repo = _repo;
        this._bookingRepo = _bookingRepo;
    }
    create(userId, doctorProfileId, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(doctorProfileId === null || doctorProfileId === void 0 ? void 0 : doctorProfileId.trim())) {
                throw Object.assign(new Error("doctorId is required"), { status: 400 });
            }
            if (!payload.scheduledFor) {
                throw Object.assign(new Error("scheduledFor is required"), { status: 400 });
            }
            const scheduledDate = new Date(payload.scheduledFor);
            if (isNaN(scheduledDate.getTime())) {
                throw Object.assign(new Error("Invalid scheduledFor date"), { status: 400 });
            }
            if (scheduledDate < new Date()) {
                throw Object.assign(new Error("Cannot schedule consultation in the past"), { status: 400 });
            }
            const durationMinutes = payload.durationMinutes || 30;
            if (durationMinutes < 5 || durationMinutes > 480) {
                throw Object.assign(new Error("Duration must be between 5 and 480 minutes"), { status: 400 });
            }
            return this._repo.create(userId, doctorProfileId, {
                scheduledFor: scheduledDate,
                durationMinutes,
                notes: payload.notes || null,
            });
        });
    }
    getConsultation(consultationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const consultation = yield this._repo.findById(consultationId);
            if (!consultation) {
                throw Object.assign(new Error("Consultation not found"), { status: 404 });
            }
            return consultation;
        });
    }
    getUserConsultations(userId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._repo.listUserConsultations(userId, status);
        });
    }
    getDoctorConsultations(doctorProfileId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._repo.listDoctorConsultations(doctorProfileId, status);
        });
    }
    prepareConsultationCall(consultationId, authUserId, authDoctorId, role) {
        return __awaiter(this, void 0, void 0, function* () {
            const consultation = yield this._repo.findById(consultationId);
            if (!consultation) {
                throw Object.assign(new Error("Consultation not found"), { status: 404 });
            }
            // Extract normalized IDs using helper function
            const patientUserId = extractObjectIdString(consultation.userId);
            const doctorProfileId = extractObjectIdString(consultation.doctorId);
            // Extract doctor's User ID (from populated Doctor.userId)
            const doctorUserId = consultation.doctorId && typeof consultation.doctorId === "object"
                ? extractObjectIdString(consultation.doctorId.userId)
                : null;
            console.log("[prepareCall] Consultation data:", {
                consultationId,
                patientUserId,
                doctorProfileId,
                doctorUserId,
            });
            if (!patientUserId) {
                throw Object.assign(new Error("Consultation missing patient user ID"), { status: 400 });
            }
            if (!doctorProfileId) {
                throw Object.assign(new Error("Consultation missing doctor profile ID"), { status: 400 });
            }
            const normalizedAuthUserId = (authUserId === null || authUserId === void 0 ? void 0 : authUserId.toString()) || "";
            const normalizedAuthDoctorId = (authDoctorId === null || authDoctorId === void 0 ? void 0 : authDoctorId.toString()) || "";
            const isPatient = normalizedAuthUserId === patientUserId;
            const isDoctorByProfile = role === "doctor" && normalizedAuthDoctorId && normalizedAuthDoctorId === doctorProfileId;
            const isDoctorByUserId = role === "doctor" && doctorUserId && normalizedAuthUserId === doctorUserId;
            const isDoctor = isDoctorByProfile || isDoctorByUserId;
            console.log("[prepareCall] Authorization check:", {
                authUserId: normalizedAuthUserId,
                authDoctorId: normalizedAuthDoctorId,
                role,
                isPatient,
                isDoctor,
            });
            if (!isPatient && !isDoctor) {
                console.error("[prepareCall] AUTHORIZATION FAILED");
                throw Object.assign(new Error("You are not allowed to join this call"), { status: 403 });
            }
            if (consultation.status === "cancelled") {
                throw Object.assign(new Error("Consultation has been cancelled"), { status: 400 });
            }
            if (consultation.status === "completed") {
                throw Object.assign(new Error("Consultation has already been completed"), { status: 400 });
            }
            let videoRoomId = consultation.videoRoomId;
            if (!videoRoomId) {
                videoRoomId = yield generateVideoRoomId(this._repo);
            }
            const updates = { videoRoomId };
            if (consultation.status !== "in_progress") {
                updates.status = "in_progress";
                updates.callStartedAt = new Date();
            }
            const updated = yield this._repo.findByIdAndUpdate(consultationId, updates);
            return {
                consultationId,
                videoRoomId: (updated === null || updated === void 0 ? void 0 : updated.videoRoomId) || videoRoomId,
                status: updated === null || updated === void 0 ? void 0 : updated.status,
                scheduledFor: updated === null || updated === void 0 ? void 0 : updated.scheduledFor,
                durationMinutes: updated === null || updated === void 0 ? void 0 : updated.durationMinutes,
            };
        });
    }
    endConsultationCall(consultationId, userId, doctorId, io) {
        return __awaiter(this, void 0, void 0, function* () {
            const consultation = yield this._repo.findById(consultationId);
            if (!consultation) {
                throw Object.assign(new Error("Consultation not found"), { status: 404 });
            }
            // Use helper function to extract IDs
            const patientUserId = extractObjectIdString(consultation.userId);
            const doctorProfileId = extractObjectIdString(consultation.doctorId);
            const normalizedUserId = (userId === null || userId === void 0 ? void 0 : userId.toString()) || "";
            const normalizedDoctorId = (doctorId === null || doctorId === void 0 ? void 0 : doctorId.toString()) || "";
            const isPatient = normalizedUserId === patientUserId;
            const isDoctor = normalizedDoctorId && normalizedDoctorId === doctorProfileId;
            console.log("[endConsultationCall] Authorization check:", {
                userId: normalizedUserId,
                doctorId: normalizedDoctorId,
                patientUserId,
                doctorProfileId,
                isPatient,
                isDoctor,
            });
            if (!isPatient && !isDoctor) {
                throw Object.assign(new Error("Unauthorized"), { status: 403 });
            }
            if (isPatient && !isDoctor) {
                console.log("[endConsultationCall] Patient attempted to end call - not allowed");
                throw Object.assign(new Error("Only the doctor can end the consultation. You can rejoin if the doctor is still available."), { status: 403, isPatientLeaving: true });
            }
            if (consultation.status === "completed") {
                console.log("[endConsultationCall] Call already completed");
                return consultation;
            }
            const updated = yield this._repo.findByIdAndUpdate(consultationId, {
                status: "completed",
                callEndedAt: new Date(),
            });
            if (io && consultation.videoRoomId) {
                const roomName = `consultation:${consultation.videoRoomId}`;
                console.log("[endConsultationCall] Emitting consultation_call_ended to room:", roomName);
                io.to(roomName).emit("consultation:call-ended", {
                    consultationId,
                    endedBy: "doctor",
                    timestamp: new Date(),
                });
            }
            return updated;
        });
    }
    cancelConsultation(consultationId, userId, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            const consultation = yield this._repo.findById(consultationId);
            if (!consultation) {
                throw Object.assign(new Error("Consultation not found"), { status: 404 });
            }
            // Use helper function
            const patientUserId = extractObjectIdString(consultation.userId);
            const doctorProfileId = extractObjectIdString(consultation.doctorId);
            const isPatient = userId === patientUserId;
            const isDoctor = userId === doctorProfileId;
            if (!isPatient && !isDoctor) {
                throw Object.assign(new Error("Unauthorized"), { status: 403 });
            }
            if (consultation.status === "completed" || consultation.status === "cancelled") {
                return consultation;
            }
            return this._repo.cancel(consultationId, userId, reason);
        });
    }
    cancelByDoctor(consultationId, authUserId, authDoctorId, role, reason, io) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(consultationId)) {
                throw Object.assign(new Error("Invalid consultation id"), { status: 400 });
            }
            if (role !== "doctor" || !authDoctorId) {
                throw Object.assign(new Error("Unauthorized"), { status: 403 });
            }
            const session = yield mongoose_1.default.startSession();
            try {
                let notificationDoc = null;
                yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b;
                    const consultation = yield consultation_schema_1.Consultation.findById(new mongoose_1.Types.ObjectId(consultationId))
                        .session(session)
                        .lean();
                    if (!consultation) {
                        throw Object.assign(new Error("Consultation not found"), { status: 404 });
                    }
                    const consultationDoctorId = (_a = consultation.doctorId) === null || _a === void 0 ? void 0 : _a.toString();
                    const consultationUserId = (_b = consultation.userId) === null || _b === void 0 ? void 0 : _b.toString();
                    if (!consultationDoctorId || !consultationUserId) {
                        throw Object.assign(new Error("Consultation is missing doctor/user"), { status: 400 });
                    }
                    if (consultationDoctorId !== (authDoctorId === null || authDoctorId === void 0 ? void 0 : authDoctorId.toString())) {
                        throw Object.assign(new Error("Unauthorized"), { status: 403 });
                    }
                    if (consultation.status === "cancelled_by_doctor") {
                        return;
                    }
                    if (consultation.status === "completed" || consultation.status === "cancelled") {
                        throw Object.assign(new Error("Consultation cannot be cancelled"), { status: 400 });
                    }
                    if (consultation.status !== "upcoming" && consultation.status !== "in_progress") {
                        throw Object.assign(new Error("Consultation cannot be cancelled"), { status: 400 });
                    }
                    const bookingIdStr = consultation.bookingId;
                    if (!bookingIdStr || !mongoose_1.Types.ObjectId.isValid(String(bookingIdStr))) {
                        throw Object.assign(new Error("Consultation bookingId is missing"), { status: 400 });
                    }
                    const booking = yield booking_schema_1.Booking.findById(new mongoose_1.Types.ObjectId(String(bookingIdStr)))
                        .session(session)
                        .lean();
                    if (!booking) {
                        throw Object.assign(new Error("Booking not found"), { status: 404 });
                    }
                    // Payment is required for wallet reversal. If not found, still allow cancellation
                    // but do not mutate wallets.
                    const payment = yield payment_model_1.PaymentModel.findOne({
                        bookingId: booking._id,
                        paymentStatus: { $in: ["success", "refunded"] },
                    })
                        .sort({ createdAt: -1 })
                        .session(session)
                        .lean();
                    // Update consultation + booking status first.
                    yield consultation_schema_1.Consultation.updateOne({ _id: new mongoose_1.Types.ObjectId(consultationId) }, {
                        $set: {
                            status: "cancelled_by_doctor",
                            cancelledBy: new mongoose_1.Types.ObjectId(authUserId),
                            cancelledAt: new Date(),
                            cancelledByRole: "doctor",
                            cancellationReason: reason || "",
                        },
                    }, { session });
                    yield booking_schema_1.Booking.updateOne({ _id: booking._id }, { $set: { status: "cancelled" } }, { session });
                    if (payment && payment.paymentStatus === "success") {
                        const currencyCode = (payment.currency || "INR").toUpperCase();
                        const amountMinor = Math.round(Number(payment.amount || 0) * 100);
                        const doctorDeductMinor = Math.round(Number(payment.doctorEarning || 0) * 100);
                        const adminDeductMinor = Math.round(Number(payment.platformFee || 0) * 100);
                        if (amountMinor <= 0) {
                            throw Object.assign(new Error("Invalid payment amount"), { status: 400 });
                        }
                        const walletCreditGate = yield payment_model_1.PaymentModel.updateOne({ _id: payment._id, paymentStatus: "success", walletCredited: { $ne: true } }, { $set: { walletCredited: true, walletCreditedAt: new Date() } }, { session });
                        if (walletCreditGate.modifiedCount === 1) {
                            if (doctorDeductMinor > 0) {
                                yield wallet_schema_1.Wallet.updateOne({ ownerType: "doctor", ownerId: payment.doctorId, currency: currencyCode }, { $inc: { balanceMinor: doctorDeductMinor } }, { upsert: true, session });
                            }
                            if (adminDeductMinor > 0) {
                                yield wallet_schema_1.Wallet.updateOne({ ownerType: "admin", currency: currencyCode }, { $inc: { balanceMinor: adminDeductMinor } }, { upsert: true, session });
                            }
                        }
                        const refundUpdate = yield payment_model_1.PaymentModel.updateOne({ _id: payment._id, paymentStatus: "success" }, { $set: { paymentStatus: "refunded" } }, { session });
                        // Idempotency: only apply wallet movements + history once
                        if (refundUpdate.modifiedCount === 1) {
                            yield wallet_schema_1.Wallet.updateOne({ ownerType: "user", ownerId: payment.patientId, currency: currencyCode }, { $inc: { balanceMinor: amountMinor } }, { upsert: true, session });
                            const doctorDebit = yield wallet_schema_1.Wallet.updateOne({
                                ownerType: "doctor",
                                ownerId: payment.doctorId,
                                currency: currencyCode,
                                balanceMinor: { $gte: doctorDeductMinor },
                            }, { $inc: { balanceMinor: -doctorDeductMinor } }, { session });
                            if (doctorDebit.modifiedCount !== 1) {
                                throw Object.assign(new Error("Insufficient doctor wallet balance"), { status: 400 });
                            }
                            const adminDebit = yield wallet_schema_1.Wallet.updateOne({
                                ownerType: "admin",
                                currency: currencyCode,
                                balanceMinor: { $gte: adminDeductMinor },
                            }, { $inc: { balanceMinor: -adminDeductMinor } }, { session });
                            if (adminDebit.modifiedCount !== 1) {
                                throw Object.assign(new Error("Insufficient admin wallet balance"), { status: 400 });
                            }
                            yield walletHistory_schema_1.WalletHistory.create([
                                {
                                    ownerType: "user",
                                    ownerId: payment.patientId,
                                    currency: currencyCode,
                                    amountMinor,
                                    direction: "credit",
                                    type: "CONSULTATION_CANCEL_REFUND",
                                    referenceId: new mongoose_1.Types.ObjectId(consultationId),
                                    bookingId: booking._id,
                                },
                                {
                                    ownerType: "doctor",
                                    ownerId: payment.doctorId,
                                    currency: currencyCode,
                                    amountMinor: doctorDeductMinor,
                                    direction: "debit",
                                    type: "CONSULTATION_CANCEL_DEDUCTION",
                                    referenceId: new mongoose_1.Types.ObjectId(consultationId),
                                    bookingId: booking._id,
                                },
                                {
                                    ownerType: "admin",
                                    currency: currencyCode,
                                    amountMinor: adminDeductMinor,
                                    direction: "debit",
                                    type: "CONSULTATION_CANCEL_DEDUCTION",
                                    referenceId: new mongoose_1.Types.ObjectId(consultationId),
                                    bookingId: booking._id,
                                },
                            ], { session, ordered: true });
                            yield booking_schema_1.Booking.updateOne({ _id: booking._id }, { $set: { status: "refunded" } }, { session });
                        }
                    }
                    notificationDoc = yield notification_schema_1.NotificationModel.create([
                        {
                            userId: new mongoose_1.Types.ObjectId(consultationUserId),
                            userRole: "user",
                            type: "CONSULTATION_CANCELLED",
                            message: "Your consultation was cancelled by the doctor. Amount refunded to wallet.",
                            meta: {
                                consultationId,
                                bookingId: String(booking._id),
                            },
                            read: false,
                        },
                    ], { session, ordered: true });
                }));
                const notif = Array.isArray(notificationDoc) ? notificationDoc[0] : notificationDoc;
                if (io && notif) {
                    io.to(`user:${notif.userId.toString()}`).emit("notification:new", {
                        _id: notif._id,
                        message: notif.message,
                        createdAt: notif.createdAt,
                        read: notif.read,
                        type: notif.type,
                        meta: notif.meta,
                    });
                }
                return { success: true };
            }
            finally {
                session.endSession();
            }
        });
    }
    getConsultationByVideoRoomId(videoRoomId) {
        return __awaiter(this, void 0, void 0, function* () {
            const consultation = yield this._repo.findByVideoRoomId(videoRoomId);
            if (!consultation) {
                throw Object.assign(new Error("Consultation not found"), { status: 404 });
            }
            return consultation;
        });
    }
    getOrCreateConsultationFromBooking(bookingId_1, patientUserId_1, doctorUserId_1, scheduledFor_1, durationMinutes_1) {
        return __awaiter(this, arguments, void 0, function* (bookingId, patientUserId, doctorUserId, scheduledFor, durationMinutes, retryCount = 0) {
            const maxRetries = 5;
            console.log("[getOrCreateConsultationFromBooking] Input:", {
                bookingId,
                patientUserId,
                doctorUserId,
                retryCount,
            });
            try {
                console.log("[getOrCreateConsultationFromBooking] Looking up Doctor with userId:", doctorUserId);
                let doctorProfile = yield doctor_schema_1.Doctor.findOne({ userId: new mongoose_1.Types.ObjectId(doctorUserId) });
                if (!doctorProfile) {
                    console.log("[getOrCreateConsultationFromBooking] Doctor profile not found, creating...");
                    doctorProfile = yield doctor_schema_1.Doctor.create({
                        userId: new mongoose_1.Types.ObjectId(doctorUserId),
                        profile: {},
                        verification: { status: "pending" },
                    });
                    console.log("[getOrCreateConsultationFromBooking] Created Doctor profile:", doctorProfile._id);
                }
                const doctorProfileId = doctorProfile._id.toString();
                const patientUserIdObj = new mongoose_1.Types.ObjectId(patientUserId);
                const doctorProfileIdObj = new mongoose_1.Types.ObjectId(doctorProfileId);
                const scheduledDate = new Date(scheduledFor);
                const videoRoomId = yield generateVideoRoomId(this._repo);
                console.log("[getOrCreateConsultationFromBooking] Checking for existing consultation by bookingId:", bookingId);
                let existingConsultation = yield this._repo.findByBookingId(bookingId);
                if (existingConsultation) {
                    // FIXED: Use helper function to extract ID from potentially populated field
                    const existingUserId = extractObjectIdString(existingConsultation.userId);
                    const expectedUserId = patientUserIdObj.toString();
                    console.log("[getOrCreateConsultationFromBooking] Found existing consultation:", {
                        _id: existingConsultation._id,
                        existingUserId,
                        expectedUserId,
                        match: existingUserId === expectedUserId,
                    });
                    if (existingUserId !== expectedUserId) {
                        console.warn("[getOrCreateConsultationFromBooking] ⚠️ CORRUPTED: userId mismatch!");
                        console.warn("[getOrCreateConsultationFromBooking] Expected:", expectedUserId, "Got:", existingUserId);
                        console.log("[getOrCreateConsultationFromBooking] Deleting corrupted consultation...");
                        yield this._repo.deleteByBookingId(bookingId);
                        existingConsultation = null;
                    }
                    else {
                        console.log("[getOrCreateConsultationFromBooking] Consultation is valid, returning existing one");
                        return yield this._repo.findById(existingConsultation._id.toString());
                    }
                }
                console.log("[getOrCreateConsultationFromBooking] Creating new consultation with atomic upsert");
                const consultation = yield this._repo.findOneAndUpsert({
                    bookingId: bookingId,
                    status: { $ne: "cancelled" },
                }, {
                    $setOnInsert: {
                        userId: patientUserIdObj,
                        doctorId: doctorProfileIdObj,
                        scheduledFor: scheduledDate,
                        durationMinutes,
                        videoRoomId,
                        notes: `Booking: ${bookingId}`,
                        status: "upcoming",
                    },
                }, {
                    upsert: true,
                    setDefaultsOnInsert: true,
                });
                console.log("[getOrCreateConsultationFromBooking] Got consultation:", {
                    _id: consultation._id,
                    videoRoomId: consultation.videoRoomId,
                });
                // FIXED: Use helper function for final validation
                const finalUserId = extractObjectIdString(consultation.userId);
                const finalDoctorId = extractObjectIdString(consultation.doctorId);
                console.log("[getOrCreateConsultationFromBooking] Final validation:", {
                    finalUserId,
                    expectedPatientId: patientUserIdObj.toString(),
                    finalDoctorId,
                    expectedDoctorId: doctorProfileIdObj.toString(),
                });
                if (finalUserId !== patientUserIdObj.toString()) {
                    throw Object.assign(new Error(`CRITICAL: Consultation userId mismatch. Expected: ${patientUserIdObj}, Got: ${finalUserId}`), { status: 500 });
                }
                if (finalDoctorId !== doctorProfileIdObj.toString()) {
                    throw Object.assign(new Error(`CRITICAL: Consultation doctorId mismatch. Expected: ${doctorProfileIdObj}, Got: ${finalDoctorId}`), { status: 500 });
                }
                return yield this._repo.findById(consultation._id.toString());
            }
            catch (error) {
                if (error.code === 11000) {
                    console.warn("[getOrCreateConsultationFromBooking] Duplicate key error (race condition)");
                    if (retryCount < maxRetries) {
                        const waitTime = 50 * Math.pow(2, retryCount);
                        console.log(`[getOrCreateConsultationFromBooking] Retrying in ${waitTime}ms (attempt ${retryCount + 1}/${maxRetries})...`);
                        yield new Promise(resolve => setTimeout(resolve, waitTime));
                        return this.getOrCreateConsultationFromBooking(bookingId, patientUserId, doctorUserId, scheduledFor, durationMinutes, retryCount + 1);
                    }
                    else {
                        console.log("[getOrCreateConsultationFromBooking] Max retries reached, searching for existing consultation...");
                        const existing = yield this._repo.findByBookingId(bookingId);
                        if (existing) {
                            console.log("[getOrCreateConsultationFromBooking] Found existing consultation after retries:", existing._id);
                            return yield this._repo.findById(existing._id.toString());
                        }
                        throw error;
                    }
                }
                throw error;
            }
        });
    }
}
exports.ConsultationService = ConsultationService;
