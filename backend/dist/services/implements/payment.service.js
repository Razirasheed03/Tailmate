"use strict";
// services/implements/payment.service.ts
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
exports.PaymentService = void 0;
const stripe_1 = require("../../utils/stripe");
const booking_schema_1 = require("../../schema/booking.schema");
class PaymentService {
    constructor(repo) {
        this.repo = repo;
    }
    createCheckoutSession(payload, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const booking = yield booking_schema_1.Booking.findById(payload.bookingId).lean();
            if (!booking)
                throw new Error("Booking not found");
            if (String(booking.patientId) !== String(userId)) {
                throw new Error("Forbidden");
            }
            const amount = Number(booking.amount || 0);
            const platformFee = Math.round(amount * 0.20);
            const doctorEarning = amount - platformFee;
            const currency = booking.currency || "INR";
            const payment = yield this.repo.create({
                patientId: booking.patientId,
                doctorId: booking.doctorId,
                bookingId: booking._id,
                amount,
                platformFee,
                doctorEarning,
                currency,
                paymentStatus: "pending",
            });
            const session = yield stripe_1.stripe.checkout.sessions.create({
                mode: "payment",
                payment_method_types: ["card"],
                line_items: [
                    {
                        price_data: {
                            currency: currency.toLowerCase(),
                            product_data: {
                                name: "Doctor consultation",
                                metadata: { bookingId: String(booking._id) },
                            },
                            unit_amount: Math.round(amount * 100),
                        },
                        quantity: 1,
                    },
                ],
                success_url: `${process.env.APP_URL}/payments/Success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.APP_URL}/payments/cancel`,
                metadata: {
                    paymentDbId: String(payment._id),
                    bookingId: String(booking._id),
                    doctorId: String(booking.doctorId),
                    patientId: String(booking.patientId),
                },
            });
            return { url: (_a = session.url) !== null && _a !== void 0 ? _a : null };
        });
    }
    processWebhook(req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const sig = req.headers["stripe-signature"];
            let event;
            try {
                event = stripe_1.stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
            }
            catch (e) {
                console.error("Stripe webhook signature error:", e === null || e === void 0 ? void 0 : e.message);
                throw new Error("Invalid signature");
            }
            if (event.type === "checkout.session.completed") {
                const session = event.data.object;
                const paymentId = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.paymentDbId;
                if (paymentId) {
                    const paymentIntentId = String(session.payment_intent || "");
                    yield this.repo.update(paymentId, {
                        paymentStatus: "success",
                        paymentIntentId,
                        receiptUrl: session.url || "",
                    });
                }
                return {
                    handled: true,
                    type: "checkout.session.completed",
                    paymentId
                };
            }
            return { handled: false, type: event.type };
        });
    }
    doctorPayments(doctorId_1) {
        return __awaiter(this, arguments, void 0, function* (doctorId, query = {}) {
            return yield this.repo.byDoctorPaginated(doctorId, query);
        });
    }
}
exports.PaymentService = PaymentService;
