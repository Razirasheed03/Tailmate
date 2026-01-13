"use strict";
// services/implements/checkout.service.ts
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
exports.CheckoutService = void 0;
const mongoose_1 = require("mongoose");
const generateBookingNumber_1 = require("../../utils/generateBookingNumber");
const booking_schema_1 = require("../../schema/booking.schema");
const stripe_1 = require("../../utils/stripe");
const payment_model_1 = require("../../models/implements/payment.model");
const url_config_1 = require("../../config/url.config");
function toUTCDate(date, time) {
    const d = new Date(`${date}T00:00:00Z`);
    const [h, m] = time.split(":").map(Number);
    d.setUTCHours(h || 0, m || 0, 0, 0);
    return d;
}
class CheckoutService {
    constructor(pub) {
        this.pub = pub;
    }
    verifyGeneratedSlot(doctorId, sel, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(doctorId))
                return null;
            if (opts === null || opts === void 0 ? void 0 : opts.minLeadMinutes) {
                const start = toUTCDate(sel.date, sel.time);
                const diffMin = Math.floor((start.getTime() - Date.now()) / 60000);
                if (diffMin < opts.minLeadMinutes)
                    return null;
            }
            const gen = yield this.pub.listGeneratedAvailability(doctorId, {
                from: sel.date,
                to: sel.date,
            });
            const match = gen.find((s) => s.date === sel.date &&
                s.time === sel.time &&
                s.durationMins === sel.durationMins &&
                Array.isArray(s.modes) &&
                s.modes.includes(sel.mode));
            if (!match)
                return null;
            const conflict = yield booking_schema_1.Booking.findOne({
                doctorId: new mongoose_1.Types.ObjectId(doctorId),
                date: sel.date,
                time: sel.time,
                status: { $in: ["pending", "paid"] },
            }).lean();
            return conflict ? null : match;
        });
    }
    getQuote(userId, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const { doctorId, date, time, durationMins, mode, baseFee } = payload || {};
            if (!doctorId || !date || !time || !durationMins || !mode) {
                throw Object.assign(new Error("Missing required fields"), { status: 400 });
            }
            const match = yield this.verifyGeneratedSlot(doctorId, { date, time, durationMins: Number(durationMins), mode }, { minLeadMinutes: 30 });
            if (!match) {
                throw Object.assign(new Error("Selected slot is not available"), { status: 400 });
            }
            const fee = Number((_b = (_a = match.fee) !== null && _a !== void 0 ? _a : baseFee) !== null && _b !== void 0 ? _b : 0);
            const tax = 0;
            const discount = 0;
            const totalAmount = fee;
            return { amount: fee, tax, discount, totalAmount, currency: "INR" };
        });
    }
    createCheckout(userId, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const { doctorId, date, time, durationMins, mode, amount, currency, petName, notes, paymentMethod, } = payload || {};
            if (!doctorId ||
                !date ||
                !time ||
                !durationMins ||
                !mode ||
                amount == null ||
                !currency ||
                !petName ||
                !paymentMethod) {
                throw Object.assign(new Error("Missing required fields"), { status: 400 });
            }
            const match = yield this.verifyGeneratedSlot(doctorId, { date, time, durationMins: Number(durationMins), mode }, { minLeadMinutes: 30 });
            if (!match) {
                throw Object.assign(new Error("Selected slot is not available"), { status: 400 });
            }
            const now = new Date();
            const day = String(now.getDate()).padStart(2, "0");
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const year = now.getFullYear();
            const today = `${day}${month}${year}`;
            const lastBooking = yield booking_schema_1.Booking.findOne({
                bookingNumber: { $regex: `^BK-${today}-` },
            })
                .sort({ createdAt: -1 })
                .lean();
            let lastSerial = 0;
            if (lastBooking && lastBooking.bookingNumber) {
                const parts = lastBooking.bookingNumber.split("-");
                lastSerial = Number(parts[2]) || 0;
            }
            const fee = Number((_b = (_a = match.fee) !== null && _a !== void 0 ? _a : amount) !== null && _b !== void 0 ? _b : 0);
            const bookingNumber = (0, generateBookingNumber_1.generateBookingNumber)(lastSerial);
            const booking = yield booking_schema_1.Booking.create({
                bookingNumber,
                patientId: new mongoose_1.Types.ObjectId(userId),
                doctorId: new mongoose_1.Types.ObjectId(doctorId),
                slotId: null,
                date,
                time,
                durationMins: Number(durationMins),
                mode,
                amount: fee,
                currency,
                petName,
                notes: notes || "",
                paymentMethod,
                status: "pending",
                paymentProvider: "stripe",
            });
            const amountMajor = Number(fee);
            const platformFeeMajor = Math.round(amountMajor * 0.2);
            const doctorEarningMajor = amountMajor - platformFeeMajor;
            const payment = yield payment_model_1.PaymentModel.create({
                patientId: new mongoose_1.Types.ObjectId(userId),
                doctorId: new mongoose_1.Types.ObjectId(doctorId),
                bookingId: booking._id,
                amount: amountMajor,
                platformFee: platformFeeMajor,
                doctorEarning: doctorEarningMajor,
                currency,
                paymentStatus: "pending",
            });
            try {
                const unitAmountMinor = Math.round(fee * 100);
                const frontendUrl = (0, url_config_1.getFrontendUrl)();
                const session = yield stripe_1.stripe.checkout.sessions.create({
                    mode: "payment",
                    line_items: [
                        {
                            price_data: {
                                currency,
                                unit_amount: unitAmountMinor,
                                product_data: { name: "Doctor consultation" },
                            },
                            quantity: 1,
                        },
                    ],
                    success_url: `${frontendUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${frontendUrl}/payments/cancel`,
                    metadata: {
                        bookingId: String(booking._id),
                        userId: String(userId),
                        doctorId: String(doctorId),
                        kind: "doctor",
                        paymentDbId: String(payment._id),
                        patientId: String(userId),
                    },
                }, { idempotencyKey: `chk:${booking._id}:${userId}` });
                yield booking_schema_1.Booking.updateOne({ _id: booking._id }, {
                    $set: {
                        paymentSessionId: session.id,
                        paymentRedirectUrl: session.url || "",
                    },
                });
                return {
                    bookingId: String(booking._id),
                    redirectUrl: (_c = session.url) !== null && _c !== void 0 ? _c : undefined,
                };
            }
            catch (err) {
                yield payment_model_1.PaymentModel.deleteOne({ _id: payment._id });
                yield booking_schema_1.Booking.deleteOne({ _id: booking._id });
                throw Object.assign(new Error("Failed to create payment session"), { status: 502 });
            }
        });
    }
}
exports.CheckoutService = CheckoutService;
