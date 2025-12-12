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
exports.AdminController = void 0;
const ResponseHelper_1 = require("../../http/ResponseHelper");
const messageConstant_1 = require("../../constants/messageConstant");
const user_model_1 = require("../../models/implements/user.model");
const pet_model_1 = require("../../models/implements/pet.model");
const booking_schema_1 = require("../../schema/booking.schema");
const payment_model_1 = require("../../models/implements/payment.model");
class AdminController {
    constructor(_adminService) {
        this._adminService = _adminService;
        this.getAllUsers = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const search = req.query.search || "";
                const result = yield this._adminService.getAllUsers(page, limit, search);
                return ResponseHelper_1.ResponseHelper.ok(res, result, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        this.blockUser = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const result = yield this._adminService.blockUser(userId);
                // result is { message: "User blocked successfully" } per service
                return ResponseHelper_1.ResponseHelper.ok(res, result, messageConstant_1.HttpResponse.RESOURCE_UPDATED);
            }
            catch (err) {
                next(err);
            }
        });
        this.unblockUser = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const result = yield this._adminService.unblockUser(userId);
                return ResponseHelper_1.ResponseHelper.ok(res, result, messageConstant_1.HttpResponse.RESOURCE_UPDATED);
            }
            catch (err) {
                next(err);
            }
        });
        this.deleteUser = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const result = yield this._adminService.deleteUser(userId);
                // Consistent 200 with message payload; alternatively could return 204
                return ResponseHelper_1.ResponseHelper.ok(res, result, messageConstant_1.HttpResponse.RESOURCE_UPDATED);
            }
            catch (err) {
                next(err);
            }
        });
        this.getUserStats = (_req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const stats = yield this._adminService.getUserStats();
                return ResponseHelper_1.ResponseHelper.ok(res, stats, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        this.getAdminEarnings = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this._adminService.getEarningsByDoctor();
                return ResponseHelper_1.ResponseHelper.ok(res, data, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        // Doctors
        this.verifyDoctor = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const reviewerId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                if (!reviewerId) {
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                }
                const { userId } = req.params;
                const result = yield this._adminService.verifyDoctor(userId, reviewerId);
                return ResponseHelper_1.ResponseHelper.ok(res, result, messageConstant_1.HttpResponse.RESOURCE_UPDATED);
            }
            catch (err) {
                next(err);
            }
        });
        this.rejectDoctor = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const reviewerId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                if (!reviewerId) {
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                }
                const { userId } = req.params;
                const { reasons } = req.body;
                const result = yield this._adminService.rejectDoctor(userId, reviewerId, reasons || []);
                return ResponseHelper_1.ResponseHelper.ok(res, result, messageConstant_1.HttpResponse.RESOURCE_UPDATED);
            }
            catch (err) {
                next(err);
            }
        });
        this.getDoctorDetail = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const data = yield this._adminService.getDoctorDetail(userId);
                if (!data) {
                    return ResponseHelper_1.ResponseHelper.notFound(res, messageConstant_1.HttpResponse.PAGE_NOT_FOUND);
                }
                return ResponseHelper_1.ResponseHelper.ok(res, data, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        this.listDoctors = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { page, limit, status, search } = req.query;
                const result = yield this._adminService.listDoctors(Number(page), Number(limit), status, search);
                return ResponseHelper_1.ResponseHelper.ok(res, result, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        this.listPetCategories = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const search = req.query.search || "";
                const active = req.query.active || "";
                const result = yield this._adminService.listPetCategories(page, limit, search, active);
                return ResponseHelper_1.ResponseHelper.ok(res, result, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        this.createPetCategory = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = req.body || {};
                const cat = yield this._adminService.createPetCategory(payload);
                return ResponseHelper_1.ResponseHelper.created(res, cat, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                const e = err;
                if ((e === null || e === void 0 ? void 0 : e.status) === 409 ||
                    (e === null || e === void 0 ? void 0 : e.code) === 11000 ||
                    String((e === null || e === void 0 ? void 0 : e.message) || "").includes("duplicate key")) {
                    return ResponseHelper_1.ResponseHelper.conflict(res, "Category name already exists (case-insensitive)");
                }
                return next(err);
            }
        });
        this.updatePetCategory = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const payload = req.body || {};
                const cat = yield this._adminService.updatePetCategory(id, payload);
                if (!cat)
                    return ResponseHelper_1.ResponseHelper.notFound(res, messageConstant_1.HttpResponse.PAGE_NOT_FOUND);
                return ResponseHelper_1.ResponseHelper.ok(res, cat, messageConstant_1.HttpResponse.RESOURCE_UPDATED);
            }
            catch (err) {
                const e = err;
                if ((e === null || e === void 0 ? void 0 : e.status) === 409 ||
                    (e === null || e === void 0 ? void 0 : e.code) === 11000 ||
                    String((e === null || e === void 0 ? void 0 : e.message) || "").includes("duplicate key")) {
                    return ResponseHelper_1.ResponseHelper.conflict(res, "Category name already exists (case-insensitive)");
                }
                return next(err);
            }
        });
        this.deletePetCategory = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.id;
                const ok = yield this._adminService.deletePetCategory(id);
                if (!ok)
                    return ResponseHelper_1.ResponseHelper.notFound(res, messageConstant_1.HttpResponse.PAGE_NOT_FOUND);
                return ResponseHelper_1.ResponseHelper.noContent(res);
            }
            catch (err) {
                next(err);
            }
        });
        this.getAdminDashboardStats = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const [totalUsers, totalDoctors, totalPets, totalBookings, totalEarnings,] = yield Promise.all([
                    user_model_1.UserModel.countDocuments({}), // all users
                    user_model_1.UserModel.countDocuments({ role: "doctor" }), // all doctors
                    pet_model_1.PetModel.countDocuments({}), // all pets
                    booking_schema_1.Booking.countDocuments({}), // all bookings
                    payment_model_1.PaymentModel.aggregate([
                        { $match: { paymentStatus: "success" } },
                        { $group: { _id: null, total: { $sum: "$platformFee" } } },
                    ]).then((res) => { var _a; return ((_a = res[0]) === null || _a === void 0 ? void 0 : _a.total) || 0; }),
                ]);
                res.json({
                    success: true,
                    data: {
                        totalUsers,
                        totalDoctors,
                        totalPets,
                        totalBookings,
                        totalEarnings,
                    },
                });
            }
            catch (err) {
                next(err);
            }
        });
        this.getIncomeByMonth = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const monthly = yield payment_model_1.PaymentModel.aggregate([
                    { $match: { paymentStatus: "success" } },
                    {
                        $group: {
                            _id: {
                                year: { $year: "$createdAt" },
                                month: { $month: "$createdAt" },
                            },
                            total: { $sum: "$platformFee" },
                        },
                    },
                    { $sort: { "_id.year": 1, "_id.month": 1 } },
                ]);
                const sorted = monthly.slice(-12); // or -6
                const months = sorted.map((e) => `${e._id.month.toString().padStart(2, "0")}/${e._id.year}`);
                const income = sorted.map((e) => e.total);
                res.json({ success: true, data: { months, income } });
            }
            catch (err) {
                next(err);
            }
        });
        this.getBookingStatusChart = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this._adminService.getBookingStatusChart();
                return ResponseHelper_1.ResponseHelper.ok(res, data, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        this.getFilteredEarnings = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { start, end, doctorId } = req.query;
                const data = yield this._adminService.getFilteredEarnings(start, end, doctorId);
                return ResponseHelper_1.ResponseHelper.ok(res, data);
            }
            catch (err) {
                next(err);
            }
        });
        this.getSimpleDoctorList = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const doctors = yield this._adminService.getSimpleDoctorList();
                return ResponseHelper_1.ResponseHelper.ok(res, doctors, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        this.getGrowthStats = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this._adminService.getGrowthStats();
                return ResponseHelper_1.ResponseHelper.ok(res, data, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
    }
}
exports.AdminController = AdminController;
