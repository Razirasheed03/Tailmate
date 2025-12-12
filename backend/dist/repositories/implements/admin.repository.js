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
exports.AdminRepository = void 0;
// src/repositories/implements/admin.repository.ts
const mongoose_1 = require("mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const petCategory_schema_1 = require("../../schema/petCategory.schema");
const doctor_schema_1 = require("../../schema/doctor.schema");
const booking_schema_1 = require("../../schema/booking.schema");
const payment_model_1 = require("../../models/implements/payment.model");
const user_model_1 = require("../../models/implements/user.model");
class AdminRepository {
    constructor(doctorModel = doctor_schema_1.Doctor, petCategoryModel = petCategory_schema_1.PetCategory) {
        this.doctorModel = doctorModel;
        this.petCategoryModel = petCategoryModel;
    }
    // ✅ Helper method to validate ObjectId
    validateObjectId(id, fieldName = 'id') {
        if (!id) {
            throw new Error(`${fieldName} is required`);
        }
        if (typeof id !== 'string' || !id.trim()) {
            throw new Error(`${fieldName} must be a valid string`);
        }
        // Use mongoose built-in validation
        if (!mongoose_2.default.isValidObjectId(id)) {
            throw new Error(`Invalid ${fieldName} format`);
        }
        // Extra check for edge cases (12-char strings)
        if (!mongoose_1.Types.ObjectId.isValid(id) || String(new mongoose_1.Types.ObjectId(id)) !== id) {
            throw new Error(`Invalid ${fieldName} format`);
        }
    }
    listDoctors(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const page = Math.max(1, Number(params.page) || 1);
            const limit = Math.min(50, Math.max(1, Number(params.limit) || 10));
            const skip = (page - 1) * limit;
            const status = params.status || "";
            const search = (params.search || "").trim();
            const match = {};
            if (status)
                match["verification.status"] = status;
            const pipeline = [
                { $match: match },
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                { $unwind: "$user" },
            ];
            if (search) {
                pipeline.push({
                    $match: {
                        $or: [
                            { "user.username": { $regex: search, $options: "i" } },
                            { "user.email": { $regex: search, $options: "i" } },
                        ],
                    },
                });
            }
            const countPipeline = [...pipeline, { $count: "count" }];
            pipeline.push({ $sort: { "verification.submittedAt": -1, createdAt: -1 } }, { $skip: skip }, { $limit: limit }, {
                $project: {
                    _id: 0,
                    userId: "$userId",
                    username: "$user.username",
                    email: "$user.email",
                    status: "$verification.status",
                    certificateUrl: "$verification.certificateUrl",
                    submittedAt: "$verification.submittedAt",
                },
            });
            const [data, countDoc] = yield Promise.all([
                this.doctorModel.aggregate(pipeline),
                this.doctorModel.aggregate(countPipeline),
            ]);
            const total = ((_a = countDoc === null || countDoc === void 0 ? void 0 : countDoc[0]) === null || _a === void 0 ? void 0 : _a.count) || 0;
            const totalPages = Math.max(1, Math.ceil(total / limit));
            return { data, page, totalPages, total };
        });
    }
    verifyDoctor(userId, reviewerId) {
        return __awaiter(this, void 0, void 0, function* () {
            // ✅ Validate both IDs
            this.validateObjectId(userId, 'userId');
            this.validateObjectId(reviewerId, 'reviewerId');
            const now = new Date();
            const updated = yield this.doctorModel.findOneAndUpdate({ userId: new mongoose_1.Types.ObjectId(userId) }, {
                $set: {
                    "verification.status": "verified",
                    "verification.verifiedAt": now,
                    "verification.reviewedBy": new mongoose_1.Types.ObjectId(reviewerId),
                },
            }, { new: true });
            if (!updated) {
                throw new Error("Doctor not found");
            }
            return updated;
        });
    }
    rejectDoctor(userId, reviewerId, reasons) {
        return __awaiter(this, void 0, void 0, function* () {
            // ✅ Validate both IDs
            this.validateObjectId(userId, 'userId');
            this.validateObjectId(reviewerId, 'reviewerId');
            const updated = yield this.doctorModel.findOneAndUpdate({ userId: new mongoose_1.Types.ObjectId(userId) }, {
                $set: {
                    "verification.status": "rejected",
                    "verification.reviewedBy": new mongoose_1.Types.ObjectId(reviewerId),
                    "verification.rejectionReasons": reasons || [],
                },
            }, { new: true });
            if (!updated) {
                throw new Error("Doctor not found");
            }
            return updated;
        });
    }
    getDoctorDetail(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // ✅ Validate userId
            this.validateObjectId(userId, 'userId');
            const _id = new mongoose_1.Types.ObjectId(userId);
            const pipeline = [
                { $match: { userId: _id } },
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                { $unwind: "$user" },
                {
                    $project: {
                        _id: 0,
                        userId: "$userId",
                        username: "$user.username",
                        email: "$user.email",
                        status: "$verification.status",
                        certificateUrl: "$verification.certificateUrl",
                        submittedAt: "$verification.submittedAt",
                        verifiedAt: "$verification.verifiedAt",
                        rejectionReasons: "$verification.rejectionReasons",
                        displayName: "$profile.displayName",
                        bio: "$profile.bio",
                        specialties: "$profile.specialties",
                        experienceYears: "$profile.experienceYears",
                        licenseNumber: "$profile.licenseNumber",
                        avatarUrl: "$profile.avatarUrl",
                        consultationFee: "$profile.consultationFee",
                    },
                },
            ];
            const res = yield this.doctorModel.aggregate(pipeline);
            if (!(res === null || res === void 0 ? void 0 : res.length)) {
                throw new Error("Doctor not found");
            }
            return res[0];
        });
    }
    listPetCategories(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = Math.max(1, Number(params.page) || 1);
            const limit = Math.min(50, Math.max(1, Number(params.limit) || 10));
            const skip = (page - 1) * limit;
            const filter = {};
            if (typeof params.active === 'string' && params.active.length) {
                filter.isActive = params.active === 'true';
            }
            if (params.search && params.search.trim()) {
                filter.name = { $regex: params.search.trim(), $options: 'i' };
            }
            const [data, total] = yield Promise.all([
                this.petCategoryModel
                    .find(filter)
                    .sort({ sortOrder: 1, name: 1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                this.petCategoryModel.countDocuments(filter),
            ]);
            const totalPages = Math.max(1, Math.ceil(total / limit));
            return { data, page, totalPages, total };
        });
    }
    createPetCategory(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const doc = yield this.petCategoryModel.create({
                name: payload.name.trim(),
                iconKey: payload.iconKey,
                description: payload.description,
                isActive: (_a = payload.isActive) !== null && _a !== void 0 ? _a : true,
                sortOrder: (_b = payload.sortOrder) !== null && _b !== void 0 ? _b : 0,
            });
            return doc.toObject();
        });
    }
    updatePetCategory(id, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            // ✅ Validate id
            this.validateObjectId(id, 'categoryId');
            const updated = yield this.petCategoryModel.findByIdAndUpdate(id, {
                $set: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (typeof payload.name === 'string' ? { name: payload.name.trim() } : {})), (typeof payload.iconKey === 'string' ? { iconKey: payload.iconKey } : {})), (typeof payload.description === 'string' ? { description: payload.description } : {})), (typeof payload.isActive === 'boolean' ? { isActive: payload.isActive } : {})), (typeof payload.sortOrder === 'number' ? { sortOrder: payload.sortOrder } : {})),
            }, { new: true, runValidators: true, context: 'query' });
            return updated ? updated.toObject() : null;
        });
    }
    deletePetCategory(id) {
        return __awaiter(this, void 0, void 0, function* () {
            // ✅ Validate id
            this.validateObjectId(id, 'categoryId');
            const deleted = yield this.petCategoryModel.findByIdAndDelete(id).lean();
            return !!deleted;
        });
    }
    getBookingStatusCounts() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield booking_schema_1.Booking.aggregate([
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 }
                    }
                }
            ]);
            // Supported statuses from model
            const counts = {
                pending: 0,
                paid: 0,
                cancelled: 0,
                failed: 0,
                refunded: 0
            };
            result.forEach(r => {
                counts[r._id] = r.count;
            });
            return {
                pending: counts.pending,
                completed: counts.paid, // paid = completed
                cancelled: counts.cancelled,
                failed: counts.failed,
                refunded: counts.refunded,
            };
        });
    }
    getFilteredEarnings(start, end, doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            const match = {};
            // DATE FILTER
            if (start && end) {
                match.createdAt = {
                    $gte: new Date(start),
                    $lte: new Date(end + "T23:59:59"),
                };
            }
            // DOCTOR FILTER (fixed)
            if (doctorId &&
                doctorId !== "null" &&
                doctorId !== "undefined" &&
                doctorId.trim() !== "") {
                match.doctorId = new mongoose_2.default.Types.ObjectId(doctorId);
            }
            console.log("APPLIED FILTER:", match); // Debug
            const result = yield payment_model_1.PaymentModel.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$amount" },
                        totalPlatformFee: { $sum: "$platformFee" },
                        totalDoctorEarnings: { $sum: "$doctorEarning" },
                        count: { $sum: 1 },
                    },
                },
            ]);
            return (result[0] || {
                totalRevenue: 0,
                totalPlatformFee: 0,
                totalDoctorEarnings: 0,
                count: 0,
            });
        });
    }
    getSimpleDoctorList() {
        return __awaiter(this, void 0, void 0, function* () {
            const list = yield payment_model_1.PaymentModel.aggregate([
                {
                    $match: {
                        paymentStatus: "success" // only successful earnings
                    }
                },
                {
                    $group: {
                        _id: "$doctorId",
                        count: { $sum: 1 } // number of payments
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "doctor"
                    }
                },
                { $unwind: "$doctor" },
                {
                    $project: {
                        _id: 1,
                        username: "$doctor.username",
                        email: "$doctor.email",
                        count: 1
                    }
                },
                { $sort: { username: 1 } }
            ]);
            return list;
        });
    }
    getGrowthStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const startCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endPrevMonth = startCurrentMonth;
            const [currentUsers, prevUsers, currentDoctors, prevDoctors, currentBookings, prevBookings,] = yield Promise.all([
                // New users this month
                user_model_1.UserModel.countDocuments({ createdAt: { $gte: startCurrentMonth } }),
                // New users previous month
                user_model_1.UserModel.countDocuments({
                    createdAt: { $gte: startPrevMonth, $lt: endPrevMonth },
                }),
                // New doctors this month
                user_model_1.UserModel.countDocuments({
                    role: "doctor",
                    createdAt: { $gte: startCurrentMonth },
                }),
                // New doctors previous month
                user_model_1.UserModel.countDocuments({
                    role: "doctor",
                    createdAt: { $gte: startPrevMonth, $lt: endPrevMonth },
                }),
                // New bookings this month
                booking_schema_1.Booking.countDocuments({ createdAt: { $gte: startCurrentMonth } }),
                // New bookings previous month
                booking_schema_1.Booking.countDocuments({
                    createdAt: { $gte: startPrevMonth, $lt: endPrevMonth },
                }),
            ]);
            return {
                users: { current: currentUsers, previous: prevUsers },
                doctors: { current: currentDoctors, previous: prevDoctors },
                bookings: { current: currentBookings, previous: prevBookings },
            };
        });
    }
}
exports.AdminRepository = AdminRepository;
