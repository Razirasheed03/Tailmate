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
exports.DoctorController = void 0;
const server_1 = require("../../server");
const payout_service_1 = require("../../services/implements/payout.service");
const notification_schema_1 = require("../../schema/notification.schema");
const user_model_1 = require("../../models/implements/user.model"); // For finding all admins if needed
const payoutService = new payout_service_1.PayoutService();
const uploadToCloudinary_1 = require("../../utils/uploadToCloudinary");
const ResponseHelper_1 = require("../../http/ResponseHelper");
const messageConstant_1 = require("../../constants/messageConstant");
class DoctorController {
    constructor(svc) {
        this.svc = svc;
        this.getVerification = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const authReq = req;
                const userId = ((_b = (_a = authReq.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.id);
                if (!userId)
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                const data = yield this.svc.getVerification(userId);
                return ResponseHelper_1.ResponseHelper.ok(res, data, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        this.uploadCertificate = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const authReq = req;
                const userId = ((_b = (_a = authReq.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.id);
                if (!userId)
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                const file = authReq.file;
                if (!file)
                    return ResponseHelper_1.ResponseHelper.badRequest(res, "No file uploaded");
                const { secure_url } = yield (0, uploadToCloudinary_1.uploadPdfBufferToCloudinary)(file.buffer, file.originalname);
                const updated = yield this.svc.uploadCertificate(userId, secure_url);
                return ResponseHelper_1.ResponseHelper.ok(res, { certificateUrl: secure_url, verification: updated }, "Certificate uploaded successfully");
            }
            catch (err) {
                next(err);
            }
        });
        this.submitForReview = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const authReq = req;
                const userId = ((_b = (_a = authReq.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.id);
                if (!userId)
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                const data = yield this.svc.submitForReview(userId);
                server_1.io.emit("admin_notification", {
                    message: "A new doctor has applied for verification",
                    doctorId: userId,
                    time: new Date().toISOString(),
                });
                // Persistent to all admins (history)
                const admins = yield user_model_1.UserModel.find({ role: "admin" }).lean();
                const notifs = admins.map(admin => ({
                    userId: admin._id,
                    userRole: "admin",
                    type: "system",
                    message: "A new doctor has applied for verification",
                    meta: {
                        doctorId: userId,
                        time: new Date().toISOString(),
                    },
                    read: false,
                }));
                if (notifs.length)
                    yield notification_schema_1.NotificationModel.insertMany(notifs);
                return ResponseHelper_1.ResponseHelper.ok(res, data, "Submitted for admin review");
            }
            catch (err) {
                const error = err;
                const status = error.status || 400;
                return ResponseHelper_1.ResponseHelper.error(res, status, "SUBMIT_ERROR", error.message || "Failed to submit for review");
            }
        });
        this.getProfile = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const authReq = req;
                const userId = ((_b = (_a = authReq.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.id);
                if (!userId)
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                const data = yield this.svc.getProfile(userId);
                return ResponseHelper_1.ResponseHelper.ok(res, data, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                const error = err;
                const status = error.status || 500;
                return ResponseHelper_1.ResponseHelper.error(res, status, "PROFILE_ERROR", error.message || "Failed to fetch profile");
            }
        });
        this.updateProfile = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const authReq = req;
                const userId = ((_b = (_a = authReq.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.id);
                if (!userId)
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                const payload = req.body || {};
                const data = yield this.svc.updateProfile(userId, payload);
                return ResponseHelper_1.ResponseHelper.ok(res, data, messageConstant_1.HttpResponse.RESOURCE_UPDATED);
            }
            catch (err) {
                const error = err;
                const status = error.status || 400;
                return ResponseHelper_1.ResponseHelper.error(res, status, "PROFILE_UPDATE_ERROR", error.message || "Failed to update profile");
            }
        });
        this.uploadAvatar = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const authReq = req;
                const userId = ((_b = (_a = authReq.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.id);
                if (!userId)
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                const file = authReq.file;
                if (!file)
                    return ResponseHelper_1.ResponseHelper.badRequest(res, "No image uploaded");
                const { secure_url } = yield (0, uploadToCloudinary_1.uploadImageBufferToCloudinary)(file.buffer, file.originalname);
                return ResponseHelper_1.ResponseHelper.ok(res, { avatarUrl: secure_url }, messageConstant_1.HttpResponse.RESOURCE_UPDATED);
            }
            catch (err) {
                next(err);
            }
        });
        this.listDaySlots = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                const date = String(req.query.date || "");
                if (!date)
                    return ResponseHelper_1.ResponseHelper.badRequest(res, "date is required");
                const data = yield this.svc.listDaySlots(userId, date);
                return ResponseHelper_1.ResponseHelper.ok(res, data, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        this.saveDaySchedule = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                const { date, slots } = req.body || {};
                if (!date || !Array.isArray(slots)) {
                    return ResponseHelper_1.ResponseHelper.badRequest(res, "date and slots are required");
                }
                const data = yield this.svc.saveDaySchedule(userId, { date, slots });
                return ResponseHelper_1.ResponseHelper.ok(res, data, messageConstant_1.HttpResponse.RESOURCE_UPDATED);
            }
            catch (err) {
                next(err);
            }
        });
        this.createDaySlot = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                const data = yield this.svc.createDaySlot(userId, req.body);
                return ResponseHelper_1.ResponseHelper.created(res, data, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        this.updateSlotStatus = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                const { status } = req.body || {};
                if (status !== "available" && status !== "booked") {
                    return ResponseHelper_1.ResponseHelper.badRequest(res, "invalid status");
                }
                const data = yield this.svc.updateSlotStatus(userId, req.params.id, status);
                return ResponseHelper_1.ResponseHelper.ok(res, data, messageConstant_1.HttpResponse.RESOURCE_UPDATED);
            }
            catch (err) {
                next(err);
            }
        });
        this.deleteDaySlot = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                const ok = yield this.svc.deleteDaySlot(userId, req.params.id);
                if (!ok)
                    return ResponseHelper_1.ResponseHelper.notFound(res, messageConstant_1.HttpResponse.PAGE_NOT_FOUND);
                return ResponseHelper_1.ResponseHelper.noContent(res);
            }
            catch (err) {
                next(err);
            }
        });
        this.listSessions = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const doctorId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                const page = Number(req.query.page || 1);
                const limit = Number(req.query.limit || 10);
                const scope = String(req.query.scope || "upcoming");
                const mode = req.query.mode ? String(req.query.mode) : undefined;
                const q = req.query.q ? String(req.query.q) : undefined;
                const data = yield this.svc.listSessions(doctorId, { page, limit, scope, mode, q });
                return ResponseHelper_1.ResponseHelper.ok(res, { items: data.items, total: data.total }, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        this.getSession = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const doctorId = ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = req.user) === null || _c === void 0 ? void 0 : _c.id);
                const id = String(req.params.id);
                const row = yield this.svc.getSession(doctorId, id);
                if (!row)
                    return ResponseHelper_1.ResponseHelper.notFound(res, messageConstant_1.HttpResponse.PAGE_NOT_FOUND);
                return ResponseHelper_1.ResponseHelper.ok(res, row, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        this.getWeeklyRules = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const userId = ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = req.user) === null || _c === void 0 ? void 0 : _c.id);
                if (!userId)
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                const data = yield this.svc.getWeeklyRules(userId);
                return ResponseHelper_1.ResponseHelper.ok(res, data, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        this.saveWeeklyRules = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const userId = ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = req.user) === null || _c === void 0 ? void 0 : _c.id);
                if (!userId)
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                const data = yield this.svc.saveWeeklyRules(userId, ((_d = req.body) === null || _d === void 0 ? void 0 : _d.rules) || []);
                return ResponseHelper_1.ResponseHelper.ok(res, data, messageConstant_1.HttpResponse.RESOURCE_UPDATED);
            }
            catch (err) {
                next(err);
            }
        });
        this.getGeneratedAvailability = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const userId = ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = req.user) === null || _c === void 0 ? void 0 : _c.id);
                if (!userId)
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                const from = String(req.query.from || "");
                const to = String(req.query.to || "");
                const rules = (_d = req.body) === null || _d === void 0 ? void 0 : _d.rules;
                const data = yield this.svc.generateAvailability(userId, from, to, rules);
                return ResponseHelper_1.ResponseHelper.ok(res, data, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        this.createStripeOnboarding = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const authReq = req;
                const userId = ((_b = (_a = authReq.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = authReq.user) === null || _c === void 0 ? void 0 : _c.id);
                if (!userId)
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                const { url, alreadyConnected } = yield this.svc.createStripeOnboarding(userId);
                return ResponseHelper_1.ResponseHelper.ok(res, { url, alreadyConnected }, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        this.requestPayout = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const userId = ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = req.user) === null || _c === void 0 ? void 0 : _c.id);
                const { amount } = req.body;
                const result = yield payoutService.doctorPayout(userId, amount);
                return ResponseHelper_1.ResponseHelper.ok(res, result);
            }
            catch (err) {
                next(err);
            }
        });
        this.listPayouts = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const userId = ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = req.user) === null || _c === void 0 ? void 0 : _c.id);
                const result = yield payoutService.getDoctorPayouts(userId);
                return ResponseHelper_1.ResponseHelper.ok(res, result);
            }
            catch (err) {
                next(err);
            }
        });
        this.doctorDashboard = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const userId = ((_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = req.user) === null || _c === void 0 ? void 0 : _c.id);
                const result = yield this.svc.doctorDashboard(userId);
                return ResponseHelper_1.ResponseHelper.ok(res, result);
            }
            catch (err) {
                next(err);
            }
        });
        this.getBookingStatusCounts = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const doctorId = req.user._id;
                const data = yield this.svc.getBookingStatusCounts(doctorId);
                return ResponseHelper_1.ResponseHelper.ok(res, data);
            }
            catch (err) {
                next(err);
            }
        });
        this.getDashboardStats = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const doctorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!doctorId) {
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, "Unauthorized");
                }
                const data = yield this.svc.getDashboardStats(doctorId);
                return ResponseHelper_1.ResponseHelper.ok(res, data);
            }
            catch (err) {
                next(err);
            }
        });
        this.getPetBookingTrends = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const doctorId = req.user._id;
                const trends = yield this.svc.getPetBookingTrends(doctorId);
                return ResponseHelper_1.ResponseHelper.ok(res, { trends });
            }
            catch (err) {
                next(err);
            }
        });
    }
}
exports.DoctorController = DoctorController;
