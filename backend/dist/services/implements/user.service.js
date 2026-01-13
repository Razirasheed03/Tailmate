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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
// backend/src/services/implements/user.service.ts
const mongoose_1 = require("mongoose");
const payment_model_1 = require("../../models/implements/payment.model");
const stripe_1 = require("../../utils/stripe");
const wallet_schema_1 = require("../../schema/wallet.schema");
const mongoose_2 = __importDefault(require("mongoose"));
const walletHistory_schema_1 = require("../../schema/walletHistory.schema");
const notification_schema_1 = require("../../schema/notification.schema");
const server_1 = require("../../server");
class UserService {
    constructor(_userRepo, _doctorPubRepo, _bookingRepo) {
        this._userRepo = _userRepo;
        this._doctorPubRepo = _doctorPubRepo;
        this._bookingRepo = _bookingRepo;
    }
    validateObjectId(id) {
        if (!mongoose_1.Types.ObjectId.isValid(id))
            throw new Error("Invalid user id");
    }
    validateUsername(username) {
        const val = (username !== null && username !== void 0 ? username : "").trim();
        if (val.length < 3)
            throw new Error("Username must be at least 3 characters");
        if (val.length > 30)
            throw new Error("Username is too long");
        return val;
    }
    updateMyUsername(userId, username) {
        return __awaiter(this, void 0, void 0, function* () {
            // Replace any with repository's updated user DTO
            this.validateObjectId(userId);
            const newUsername = this.validateUsername(username);
            const updated = yield this._userRepo.updateUsername(userId, newUsername);
            if (!updated)
                throw new Error("User not found");
            return updated;
        });
    }
    listDoctorsWithNextSlot(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = Math.max(1, Number(params.page) || 1);
            const limit = Math.min(50, Math.max(1, Number(params.limit) || 12));
            const search = (params.search || "").trim();
            const specialty = (params.specialty || "").trim();
            return this._doctorPubRepo.listVerifiedWithNextSlot({
                page,
                limit,
                search,
                specialty,
            });
        });
    }
    getDoctorPublicById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._doctorPubRepo.getDoctorPublicById(id);
        });
    }
    listDoctorGeneratedAvailability(id, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._doctorPubRepo.listGeneratedAvailability(id, opts);
        });
    }
    listMyBookings(userId, params) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validateObjectId(userId);
            const page = Math.max(1, params.page);
            const limit = Math.min(50, Math.max(1, params.limit));
            return this._bookingRepo.listUserBookings({
                userId,
                page,
                limit,
                scope: params.scope,
                status: params.status,
                mode: params.mode,
                q: params.q,
            });
        });
    }
    getMyBookingById(userId, bookingId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validateObjectId(userId);
            if (!mongoose_1.Types.ObjectId.isValid(bookingId))
                throw new Error("Invalid booking id");
            return this._bookingRepo.getUserBookingById(userId, bookingId);
        });
    }
    cancelMyBooking(userId, bookingId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            this.validateObjectId(userId);
            if (!mongoose_1.Types.ObjectId.isValid(bookingId))
                throw new Error("Invalid booking id");
            // Cancel in repository, status: 'cancelled'
            const cancelled = yield this._bookingRepo.cancelUserBooking(userId, bookingId);
            if (!cancelled) {
                const existing = yield this._bookingRepo.findById(bookingId);
                if (existing &&
                    String(existing.patientId) === String(userId) &&
                    (existing.status === "cancelled" || existing.status === "refunded")) {
                    return { success: true, message: "Booking cancelled successfully." };
                }
                return { success: false, message: "Booking not found or cannot be cancelled" };
            }
            const payment = yield payment_model_1.PaymentModel.findOne({
                bookingId: cancelled._id,
                paymentStatus: "success",
            }).lean();
            if (!payment) {
                return {
                    success: true,
                    message: "Booking cancelled but payment not found or not successful, no refund issued.",
                };
            }
            // Refund in Stripe
            let stripeRefund;
            try {
                if (payment.paymentIntentId) {
                    stripeRefund = yield stripe_1.stripe.refunds.create({
                        payment_intent: payment.paymentIntentId,
                        reason: "requested_by_customer",
                    });
                }
            }
            catch (err) {
                console.error("Stripe refund error:", err);
                return {
                    success: true,
                    message: "Booking cancelled but Stripe refund failed. Please contact support.",
                };
            }
            // === Update wallets + mark refunded atomically (DB transaction) ===
            const currencyCode = (payment.currency || "INR").toUpperCase();
            const amountMinor = Math.round(Number(payment.amount || 0) * 100);
            const doctorDeductMinor = Math.round(Number(payment.doctorEarning || 0) * 100);
            const adminDeductMinor = Math.round(Number(payment.platformFee || 0) * 100);
            const session = yield mongoose_2.default.startSession();
            try {
                yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
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
                                referenceId: payment._id,
                                bookingId: payment.bookingId || null,
                            },
                            {
                                ownerType: "doctor",
                                ownerId: payment.doctorId,
                                currency: currencyCode,
                                amountMinor: doctorDeductMinor,
                                direction: "debit",
                                type: "CONSULTATION_CANCEL_DEDUCTION",
                                referenceId: payment._id,
                                bookingId: payment.bookingId || null,
                            },
                            {
                                ownerType: "admin",
                                currency: currencyCode,
                                amountMinor: adminDeductMinor,
                                direction: "debit",
                                type: "CONSULTATION_CANCEL_DEDUCTION",
                                referenceId: payment._id,
                                bookingId: payment.bookingId || null,
                            },
                        ], { session, ordered: true });
                        // Keep existing behavior: booking becomes refunded
                        yield this._bookingRepo.updateBookingStatus(bookingId, "refunded", session);
                    }
                }));
            }
            finally {
                session.endSession();
            }
            // Notify doctor (real-time + DB) about cancellation/refund
            try {
                const notificationMsg = "Booking cancelled by user. Amount refunded to patient wallet.";
                const doctorIdStr = ((_b = (_a = payment === null || payment === void 0 ? void 0 : payment.doctorId) === null || _a === void 0 ? void 0 : _a.toString) === null || _b === void 0 ? void 0 : _b.call(_a)) || String(payment.doctorId);
                const bookingIdStr = ((_d = (_c = payment === null || payment === void 0 ? void 0 : payment.bookingId) === null || _c === void 0 ? void 0 : _c.toString) === null || _d === void 0 ? void 0 : _d.call(_c)) || bookingId;
                const notif = yield notification_schema_1.NotificationModel.findOneAndUpdate({
                    userId: doctorIdStr,
                    userRole: "doctor",
                    type: "CONSULTATION_CANCELLED",
                    "meta.bookingId": bookingIdStr,
                }, {
                    $setOnInsert: {
                        message: notificationMsg,
                        meta: { bookingId: bookingIdStr },
                        read: false,
                    },
                }, { upsert: true, new: true }).lean();
                if (server_1.io && doctorIdStr && (notif === null || notif === void 0 ? void 0 : notif._id)) {
                    server_1.io.to(`user:${doctorIdStr}`).emit("notification:new", {
                        _id: notif._id,
                        message: notif.message,
                        createdAt: notif.createdAt,
                        read: notif.read,
                        type: notif.type,
                        meta: notif.meta,
                    });
                }
            }
            catch (notifyErr) {
                console.error("[NOTIFICATION] doctor cancel notify error:", notifyErr);
            }
            return {
                success: true,
                message: "Booking cancelled and refunded successfully.",
            };
        });
    }
}
exports.UserService = UserService;
