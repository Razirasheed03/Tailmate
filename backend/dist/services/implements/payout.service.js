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
exports.PayoutService = void 0;
// backend/src/services/implements/payout.service.ts
const wallet_schema_1 = require("../../schema/wallet.schema");
const payout_schema_1 = require("../../schema/payout.schema");
const doctor_model_1 = require("../../models/implements/doctor.model");
const stripe_1 = require("../../utils/stripe");
const doctorPayout_schema_1 = require("../../schema/doctorPayout.schema");
class PayoutService {
    constructor() {
        this.doctorPayout = (userId, amount) => __awaiter(this, void 0, void 0, function* () {
            const doctor = yield doctor_model_1.DoctorModel.findOne({ userId });
            if (!doctor || !doctor.stripeAccountId)
                throw new Error("Stripe not connected");
            // TODO: Check available balance logic here!
            // Create payout with Stripe Connect (sandbox will only simulate)
            yield stripe_1.stripe.transfers.create({
                amount: Math.floor(amount * 100), // INR: paise, USD: cents
                currency: "inr",
                destination: doctor.stripeAccountId,
                description: "Doctor payout",
            });
            // Record payout in DB
            yield doctorPayout_schema_1.DoctorPayoutModel.create({
                doctorId: doctor._id,
                amount,
                status: "pending",
                createdAt: new Date(),
            });
            return { message: "Payout requested" };
        });
        this.getDoctorPayouts = (userId) => __awaiter(this, void 0, void 0, function* () {
            const doctor = yield doctor_model_1.DoctorModel.findOne({ userId });
            if (!doctor)
                return [];
            return doctorPayout_schema_1.DoctorPayoutModel.find({ doctorId: doctor._id })
                .sort({ createdAt: -1 })
                .lean();
        });
    }
    requestPayout(ownerType, ownerId, amount, currency) {
        return __awaiter(this, void 0, void 0, function* () {
            // Ensure enough balance
            const wallet = yield wallet_schema_1.Wallet.findOne({ ownerType, ownerId, currency });
            if (!wallet || wallet.balanceMinor < amount * 100) {
                throw new Error("Insufficient wallet balance");
            }
            // Deduct wallet balance immediately (optimistic approach)
            yield wallet_schema_1.Wallet.updateOne({ ownerType, ownerId, currency }, { $inc: { balanceMinor: -Math.round(amount * 100) } });
            // Create payout request
            const payout = yield payout_schema_1.Payout.create({
                ownerType,
                ownerId,
                amountMinor: Math.round(amount * 100),
                currency,
                status: "pending",
                requestedAt: new Date(),
            });
            return payout;
        });
    }
    // Mark payout as completed/failed after manual or automated processing
    completePayout(payoutId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield payout_schema_1.Payout.findByIdAndUpdate(payoutId, {
                status: "completed", completedAt: new Date()
            }, { new: true });
        });
    }
    failPayout(payoutId, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            // Optionally refund the wallet if failed
            const payout = yield payout_schema_1.Payout.findByIdAndUpdate(payoutId, {
                status: "failed", failureReason: reason
            }, { new: true });
            if (payout) {
                yield wallet_schema_1.Wallet.updateOne({ ownerType: payout.ownerType, ownerId: payout.ownerId, currency: payout.currency }, { $inc: { balanceMinor: payout.amountMinor } });
            }
            return payout;
        });
    }
    // Show payout history for a user/doctor
    listPayouts(ownerType, ownerId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield payout_schema_1.Payout.find({ ownerType, ownerId }).sort({ requestedAt: -1 }).lean();
        });
    }
}
exports.PayoutService = PayoutService;
