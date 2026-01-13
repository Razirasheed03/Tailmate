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
exports.paymentsWebhook = paymentsWebhook;
const stripe_1 = require("../../utils/stripe");
const payment_model_1 = require("../../models/implements/payment.model");
const booking_schema_1 = require("../../schema/booking.schema");
const marketOrder_schema_1 = require("../../schema/marketOrder.schema");
const marketplaceListing_schema_1 = require("../../schema/marketplaceListing.schema");
const pet_schema_1 = require("../../schema/pet.schema");
const wallet_schema_1 = require("../../schema/wallet.schema");
const mongoose_1 = __importStar(require("mongoose"));
const server_1 = require("../../server"); // ensure server exports io!
const notification_schema_1 = require("../../schema/notification.schema");
// Helper log function for clarity in logs
function logWithTag(tag, ...args) {
    console.log(`[StripeWebhook][${tag}]`, ...args);
}
function paymentsWebhook(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const sig = req.headers["stripe-signature"];
        logWithTag("INIT", "Webhook triggered, signature present:", !!sig);
        try {
            const event = stripe_1.stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
            logWithTag("EVENT", "Type:", event.type);
            // --------- Doctor Booking Flow ---------
            if (event.type === "checkout.session.completed") {
                const session = event.data.object;
                const kind = ((_a = session.metadata) === null || _a === void 0 ? void 0 : _a.kind) || "doctor";
                logWithTag("SESSION", "session id:", session.id, "kind:", kind, "metadata:", session.metadata);
                if (kind === "doctor") {
                    const paymentId = (_b = session.metadata) === null || _b === void 0 ? void 0 : _b.paymentDbId;
                    const bookingId = (_c = session.metadata) === null || _c === void 0 ? void 0 : _c.bookingId;
                    const doctorId = (_d = session.metadata) === null || _d === void 0 ? void 0 : _d.doctorId;
                    const paymentIntentId = typeof session.payment_intent === "string"
                        ? session.payment_intent
                        : ((_e = session.payment_intent) === null || _e === void 0 ? void 0 : _e.id) || "";
                    // Ensure payment record exists and is updated (supports older sessions without paymentDbId)
                    let updatedPayment = null;
                    if (paymentId && mongoose_1.Types.ObjectId.isValid(paymentId)) {
                        logWithTag("PAYMENT", "Updating PaymentModel by paymentDbId:", paymentId, "paymentIntentId:", paymentIntentId);
                        updatedPayment = yield payment_model_1.PaymentModel.findOneAndUpdate({ _id: new mongoose_1.Types.ObjectId(paymentId), paymentStatus: { $ne: "refunded" } }, { $set: { paymentStatus: "success", paymentIntentId } }, { new: true }).lean();
                    }
                    if (!updatedPayment && bookingId && mongoose_1.Types.ObjectId.isValid(bookingId)) {
                        logWithTag("PAYMENT", "Updating PaymentModel by bookingId:", bookingId, "paymentIntentId:", paymentIntentId);
                        updatedPayment = yield payment_model_1.PaymentModel.findOneAndUpdate({ bookingId: new mongoose_1.Types.ObjectId(bookingId), paymentStatus: { $ne: "refunded" } }, { $set: { paymentStatus: "success", paymentIntentId } }, { new: true, sort: { createdAt: -1 } }).lean();
                    }
                    if (!updatedPayment && bookingId && mongoose_1.Types.ObjectId.isValid(bookingId)) {
                        const bookingForPayment = yield booking_schema_1.Booking.findById(bookingId).lean();
                        if (bookingForPayment) {
                            const amountMajor = Number(bookingForPayment.amount || 0);
                            const platformFeeMajor = Math.round(amountMajor * 0.2);
                            const doctorEarningMajor = amountMajor - platformFeeMajor;
                            logWithTag("PAYMENT", "Creating missing PaymentModel for bookingId:", bookingId);
                            yield payment_model_1.PaymentModel.create({
                                patientId: bookingForPayment.patientId,
                                doctorId: bookingForPayment.doctorId,
                                bookingId: bookingForPayment._id,
                                amount: amountMajor,
                                platformFee: platformFeeMajor,
                                doctorEarning: doctorEarningMajor,
                                currency: bookingForPayment.currency || "INR",
                                paymentStatus: "success",
                                paymentIntentId,
                            });
                        }
                    }
                    if (!bookingId) {
                        logWithTag("ERROR", "No bookingId present in metadata for doctor checkout.");
                        return res.status(200).send("ok");
                    }
                    if (!mongoose_1.Types.ObjectId.isValid(bookingId)) {
                        logWithTag("ERROR", "bookingId is not valid ObjectId:", bookingId);
                        return res.status(200).send("ok");
                    }
                    const dbSession = yield mongoose_1.default.startSession();
                    try {
                        yield dbSession.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                            logWithTag("BOOKING", "Marking booking as paid:", bookingId);
                            const bookingPaidUpdate = yield booking_schema_1.Booking.updateOne({ _id: new mongoose_1.Types.ObjectId(bookingId), status: { $in: ["pending", "failed"] } }, {
                                status: "paid",
                                paidAt: new Date(),
                                paymentIntentId,
                                paymentSessionId: session.id,
                            }, { session: dbSession });
                            // Wallet funding is required so later cancellations can debit doctor/admin without going negative.
                            // Make it crash-safe + idempotent by gating via Payment.walletCredited inside the same DB transaction.
                            if (bookingPaidUpdate.modifiedCount === 1) {
                                const paymentRow = yield payment_model_1.PaymentModel.findOne({
                                    bookingId: new mongoose_1.Types.ObjectId(bookingId),
                                    paymentStatus: "success",
                                })
                                    .sort({ createdAt: -1 })
                                    .session(dbSession)
                                    .lean();
                                if (!paymentRow) {
                                    logWithTag("WALLET", "No success PaymentModel found to credit wallets. bookingId:", bookingId);
                                    return;
                                }
                                const walletCreditGate = yield payment_model_1.PaymentModel.updateOne({ _id: paymentRow._id, walletCredited: { $ne: true }, paymentStatus: "success" }, { $set: { walletCredited: true, walletCreditedAt: new Date() } }, { session: dbSession });
                                if (walletCreditGate.modifiedCount !== 1) {
                                    return;
                                }
                                const currencyCode = (paymentRow.currency || "INR").toUpperCase();
                                const doctorEarnMinor = Math.round(Number(paymentRow.doctorEarning || 0) * 100);
                                const platformFeeMinor = Math.round(Number(paymentRow.platformFee || 0) * 100);
                                if (doctorEarnMinor > 0) {
                                    yield wallet_schema_1.Wallet.updateOne({ ownerType: "doctor", ownerId: paymentRow.doctorId, currency: currencyCode }, { $inc: { balanceMinor: doctorEarnMinor } }, { upsert: true, session: dbSession });
                                }
                                if (platformFeeMinor > 0) {
                                    yield wallet_schema_1.Wallet.updateOne({ ownerType: "admin", currency: currencyCode }, { $inc: { balanceMinor: platformFeeMinor } }, { upsert: true, session: dbSession });
                                }
                                logWithTag("WALLET", "Credited doctor/admin wallets for bookingId:", bookingId);
                            }
                        }));
                    }
                    finally {
                        dbSession.endSession();
                    }
                    const paidBooking = yield booking_schema_1.Booking.findOne({ _id: bookingId, status: "paid" }).lean();
                    if (!paidBooking) {
                        logWithTag("ERROR", "Booking marked as paid not found in DB!", bookingId);
                        return res.status(200).send("ok");
                    }
                    if (!doctorId) {
                        logWithTag("ERROR", "No doctorId in metadata for room join/emit.");
                        return res.status(200).send("ok");
                    }
                    // Log current IO rooms for diagnosis
                    const allRooms = Object.keys(server_1.io.sockets.adapter.rooms);
                    logWithTag("SOCKET.IO", "Current rooms:", allRooms);
                    // Format a friendly slot message
                    const slotDate = new Date(`${paidBooking.date}T${paidBooking.time}:00`);
                    const dateMsg = slotDate.toLocaleDateString("en-US", {
                        weekday: "long", year: "numeric", month: "short", day: "numeric"
                    });
                    const timeMsg = paidBooking.time;
                    const notificationMsg = `${dateMsg} ${timeMsg} slot booked!`;
                    // Emit to doctor user room (sockets join user:${userId})
                    const roomName = `user:${doctorId}`;
                    logWithTag("NOTIFY", `Emitting notification to room: ${roomName}`);
                    server_1.io.to(roomName).emit("doctor_notification", {
                        message: notificationMsg,
                        patientName: paidBooking.petName,
                        date: paidBooking.date,
                        time: paidBooking.time,
                        bookingId: String(paidBooking._id),
                        createdAt: paidBooking.createdAt,
                        bookingsUrl: "/doctor/appointments",
                    });
                    // Idempotent notification (prevents duplicates on webhook retries); only emit when inserted
                    const notifFilter = {
                        userId: new mongoose_1.Types.ObjectId(doctorId),
                        userRole: "doctor",
                        type: "booking",
                        "meta.bookingId": String(paidBooking._id),
                    };
                    const notifUpsert = yield notification_schema_1.NotificationModel.updateOne(notifFilter, {
                        $setOnInsert: {
                            message: notificationMsg,
                            meta: {
                                patientName: paidBooking.petName,
                                date: paidBooking.date,
                                time: paidBooking.time,
                                bookingId: String(paidBooking._id),
                            },
                            read: false,
                        },
                    }, { upsert: true, setDefaultsOnInsert: true });
                    if (notifUpsert.upsertedCount === 1) {
                        const notifDoc = yield notification_schema_1.NotificationModel.findOne(notifFilter).lean();
                        if (notifDoc === null || notifDoc === void 0 ? void 0 : notifDoc._id) {
                            server_1.io.to(roomName).emit("notification:new", {
                                _id: notifDoc._id,
                                message: notifDoc.message,
                                createdAt: notifDoc.createdAt,
                                read: notifDoc.read,
                                type: notifDoc.type,
                                meta: notifDoc.meta,
                            });
                        }
                    }
                    logWithTag("NOTIFY", `Notification emitted for doctorId: ${doctorId}, bookingId: ${bookingId}`);
                }
                // --------- Marketplace Order Flow ---------
                if (kind === "marketplace") {
                    const orderId = (_f = session.metadata) === null || _f === void 0 ? void 0 : _f.orderId;
                    if (!orderId || !mongoose_1.Types.ObjectId.isValid(orderId)) {
                        logWithTag("ERROR", "Invalid or missing orderId in metadata:", { orderId, metadata: session.metadata });
                        return res.status(200).send("ok");
                    }
                    const order = yield marketOrder_schema_1.MarketOrder.findById(orderId);
                    if (!order) {
                        logWithTag("ERROR", "Marketplace order not found for id:", orderId);
                        return res.status(200).send("ok");
                    }
                    if (order.status !== "created") {
                        logWithTag("SKIP", `Order ${orderId} already processed with status: ${order.status}`);
                        return res.status(200).send("ok");
                    }
                    const paymentIntentId = typeof session.payment_intent === "string"
                        ? session.payment_intent
                        : ((_g = session.payment_intent) === null || _g === void 0 ? void 0 : _g.id) || "";
                    if (!paymentIntentId) {
                        logWithTag("ERROR", "No paymentIntentId on session:", session);
                        return res.status(200).send("ok");
                    }
                    let chargeId = null;
                    try {
                        const paymentIntent = yield stripe_1.stripe.paymentIntents.retrieve(paymentIntentId);
                        chargeId = typeof paymentIntent.latest_charge === "string"
                            ? paymentIntent.latest_charge
                            : ((_h = paymentIntent.latest_charge) === null || _h === void 0 ? void 0 : _h.id) || null;
                        logWithTag("CHARGE", `Retrieved charge on PaymentIntent ${paymentIntentId}:`, chargeId);
                    }
                    catch (error) {
                        logWithTag("ERROR", "Failed to retrieve PaymentIntent:", error.message);
                        order.status = "failed";
                        yield order.save();
                        return res.status(500).send("PaymentIntent retrieval failed");
                    }
                    order.paymentIntentId = paymentIntentId;
                    order.chargeId = chargeId !== null && chargeId !== void 0 ? chargeId : "";
                    order.status = "paid";
                    yield order.save();
                    logWithTag("ORDER", `Order ${orderId} status updated to paid`);
                    // Credit seller's wallet
                    yield wallet_schema_1.Wallet.updateOne({ ownerType: "user", ownerId: order.sellerId, currency: (order.currency || "INR").toUpperCase() }, { $inc: { balanceMinor: Math.round(order.amount * 100) } }, { upsert: true });
                    logWithTag("WALLET", "Seller wallet credited for id:", order.sellerId);
                    // Pet transfer logic...
                    if (order.petId) {
                        yield pet_schema_1.Pet.findByIdAndUpdate(order.petId, {
                            currentOwnerId: order.buyerId,
                            $push: {
                                history: {
                                    at: new Date(),
                                    action: "ownership_transferred",
                                    by: order.buyerId,
                                    meta: { from: order.sellerId, orderId: order._id },
                                },
                            },
                            status: "active",
                        });
                        logWithTag("PET", "Pet ownership transferred to buyer:", order.buyerId);
                    }
                    yield marketplaceListing_schema_1.MarketplaceListing.findByIdAndUpdate(order.listingId, {
                        status: "closed",
                        $push: {
                            history: {
                                at: new Date(),
                                action: "status_changed",
                                by: order.buyerId,
                                meta: { status: "closed", reason: "payment_succeeded" },
                            },
                        },
                    });
                    logWithTag("LISTING", "Marketplace listing closed:", order.listingId);
                }
                // -- Add similar blocks for other "kind" if needed --
            }
            // --- Other Stripe event types --
            logWithTag("SKIP", "Event type not handled. Returning 200.");
            return res.status(200).send("ok");
        }
        catch (error) {
            logWithTag("FATAL", "Stripe webhook error:", error === null || error === void 0 ? void 0 : error.message);
            return res.status(400).send("Webhook error");
        }
    });
}
