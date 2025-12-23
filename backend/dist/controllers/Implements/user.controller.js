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
exports.UserController = void 0;
const ResponseHelper_1 = require("../../http/ResponseHelper");
const messageConstant_1 = require("../../constants/messageConstant");
const wallet_schema_1 = require("../../schema/wallet.schema");
const payment_model_1 = require("../../models/implements/payment.model");
class UserController {
    constructor(service) {
        this.service = service;
        this.updateMyProfile = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const uid = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                if (!uid)
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                const { username } = req.body || {};
                if (!username) {
                    return ResponseHelper_1.ResponseHelper.badRequest(res, "username is required");
                }
                const user = yield this.service.updateMyUsername(uid, username);
                return ResponseHelper_1.ResponseHelper.ok(res, {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    isBlocked: user.isBlocked,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                }, messageConstant_1.HttpResponse.RESOURCE_UPDATED);
            }
            catch (err) {
                const e = err;
                if ((e === null || e === void 0 ? void 0 : e.code) === 11000) {
                    return ResponseHelper_1.ResponseHelper.conflict(res, messageConstant_1.HttpResponse.USERNAME_EXIST);
                }
                if ((e === null || e === void 0 ? void 0 : e.name) === "ValidationError") {
                    return ResponseHelper_1.ResponseHelper.badRequest(res, e.message);
                }
                return next(err);
            }
        });
        this.listDoctors = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 12;
                const search = String(req.query.search || "");
                const specialty = String(req.query.specialty || "");
                const result = yield this.service.listDoctorsWithNextSlot({
                    page,
                    limit,
                    search,
                    specialty,
                });
                return ResponseHelper_1.ResponseHelper.ok(res, { items: result.items, total: result.total }, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                return next(err);
            }
        });
        this.getVetDetail = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = String(req.params.id || "").trim();
                if (!id)
                    return ResponseHelper_1.ResponseHelper.badRequest(res, "id is required");
                const data = yield this.service.getDoctorPublicById(id);
                if (!data)
                    return ResponseHelper_1.ResponseHelper.notFound(res, "Doctor not found");
                return ResponseHelper_1.ResponseHelper.ok(res, data, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                return next(err);
            }
        });
        this.getVetSlots = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = String(req.params.id || "").trim();
                const from = String(req.query.from || "").trim();
                const to = String(req.query.to || "").trim();
                if (!id || !from || !to) {
                    return ResponseHelper_1.ResponseHelper.badRequest(res, "id, from and to are required");
                }
                const data = yield this.service.listDoctorGeneratedAvailability(id, {
                    from,
                    to,
                });
                return ResponseHelper_1.ResponseHelper.ok(res, data, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                return next(err);
            }
        });
        this.listMyBookings = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                if (!userId) {
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                }
                const page = Number(req.query.page || 1);
                const limit = Number(req.query.limit || 10);
                const scope = String(req.query.scope || "upcoming");
                const status = req.query.status ? String(req.query.status) : undefined;
                const mode = req.query.mode
                    ? String(req.query.mode)
                    : undefined;
                const q = req.query.q ? String(req.query.q) : undefined;
                const data = yield this.service.listMyBookings(userId, {
                    page,
                    limit,
                    scope,
                    status,
                    mode,
                    q,
                });
                return ResponseHelper_1.ResponseHelper.ok(res, { items: data.items, total: data.total }, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                return next(err);
            }
        });
        this.getMyBooking = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                const bookingId = req.params.id;
                if (!userId) {
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                }
                const booking = yield this.service.getMyBookingById(userId, bookingId);
                if (!booking) {
                    return ResponseHelper_1.ResponseHelper.notFound(res, "Booking not found");
                }
                return ResponseHelper_1.ResponseHelper.ok(res, booking, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                return next(err);
            }
        });
        this.cancelMyBooking = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                const bookingId = req.params.id;
                if (!userId) {
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                }
                const result = yield this.service.cancelMyBooking(userId, bookingId);
                if (!result.success) {
                    return ResponseHelper_1.ResponseHelper.badRequest(res, result.message || "Failed to cancel booking");
                }
                return ResponseHelper_1.ResponseHelper.ok(res, null, result.message || "Booking cancelled successfully");
            }
            catch (err) {
                return next(err);
            }
        });
        this.getMyWallet = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_b = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                if (!userId)
                    return res.status(401).json({ success: false, message: "Unauthorized" });
                const wallet = yield wallet_schema_1.Wallet.findOne({ ownerType: "user", ownerId: userId });
                if (!wallet) {
                    return res.json({
                        success: true,
                        data: { currency: "INR", balanceMinor: 0 },
                    });
                }
                res.json({ success: true, data: wallet });
            }
            catch (err) {
                next(err);
            }
        });
        this.getMyWalletTransactions = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_b = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                if (!userId)
                    return res.status(401).json({ success: false, message: "Unauthorized" });
                // Only refunds
                const transactions = yield payment_model_1.PaymentModel.find({
                    patientId: userId,
                    paymentStatus: "refunded",
                })
                    .sort({ createdAt: -1 })
                    .select("amount currency createdAt bookingId paymentStatus")
                    .lean();
                res.json({ success: true, data: transactions });
            }
            catch (err) {
                next(err);
            }
        });
    }
}
exports.UserController = UserController;
