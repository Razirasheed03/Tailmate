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
exports.UserService = void 0;
// backend/src/services/implements/user.service.ts
const mongoose_1 = require("mongoose");
const payment_model_1 = require("../../models/implements/payment.model");
const stripe_1 = require("../../utils/stripe");
const wallet_schema_1 = require("../../schema/wallet.schema");
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
            this.validateObjectId(userId);
            if (!mongoose_1.Types.ObjectId.isValid(bookingId))
                throw new Error("Invalid booking id");
            // Cancel in repository, status: 'cancelled'
            const cancelled = yield this._bookingRepo.cancelUserBooking(userId, bookingId);
            if (!cancelled) {
                return {
                    success: false,
                    message: "Booking not found or cannot be cancelled",
                };
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
            // === Update wallets ===
            const { amount, platformFee, doctorEarning, currency } = payment;
            const currencyCode = (currency || "INR").toUpperCase();
            // Decrement doctor wallet
            yield wallet_schema_1.Wallet.updateOne({
                ownerType: "doctor",
                ownerId: payment.doctorId,
                currency: currencyCode,
            }, { $inc: { balanceMinor: -Math.round(doctorEarning * 100) } });
            // Decrement admin wallet
            yield wallet_schema_1.Wallet.updateOne({ ownerType: "admin", currency: currencyCode }, { $inc: { balanceMinor: -Math.round(platformFee * 100) } });
            // Credit user wallet
            yield wallet_schema_1.Wallet.updateOne({ ownerType: "user", ownerId: payment.patientId, currency: currencyCode }, { $inc: { balanceMinor: Math.round(amount * 100) } }, { upsert: true });
            // Optionally, mark booking as 'refunded'
            yield this._bookingRepo.updateBookingStatus(bookingId, "refunded");
            yield payment_model_1.PaymentModel.findByIdAndUpdate(payment._id, {
                paymentStatus: "refunded",
            });
            return {
                success: true,
                message: "Booking cancelled and refunded successfully.",
            };
        });
    }
}
exports.UserService = UserService;
