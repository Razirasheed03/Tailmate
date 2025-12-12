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
exports.DoctorRepository = void 0;
// backend/src/repositories/implements/doctor.repository.ts
const mongoose_1 = __importStar(require("mongoose"));
const doctor_model_1 = require("../../models/implements/doctor.model");
const booking_schema_1 = require("../../schema/booking.schema");
const user_model_1 = require("../../models/implements/user.model");
const payment_model_1 = require("../../models/implements/payment.model");
class DoctorRepository {
    constructor(model = doctor_model_1.DoctorModel) {
        this.model = model;
    }
    createIfMissing(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            let doc = yield this.model.findOne({ userId });
            if (!doc) {
                doc = yield this.model.create({
                    userId,
                    verification: {
                        status: "not_submitted",
                        certificateUrl: undefined,
                        submittedAt: undefined,
                        rejectionReasons: []
                    }
                });
            }
            return doc;
        });
    }
    getVerification(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.model.findOne({ userId }).select("verification");
            if (!doc) {
                return {
                    status: "not_submitted",
                    certificateUrl: undefined,
                    rejectionReasons: []
                };
            }
            return doc.verification;
        });
    }
    submitCertificate(userId, certificateUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const updated = yield this.model
                .findOneAndUpdate({ userId }, {
                $set: {
                    "verification.certificateUrl": certificateUrl,
                    "verification.status": "pending",
                    "verification.rejectionReasons": [],
                    "verification.submittedAt": now,
                },
            }, { new: true, upsert: true })
                .select("verification");
            if (!updated)
                throw new Error("Doctor not found");
            return updated;
        });
    }
    getProfile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.model.findOne({ userId }).select("profile");
            if (!doc)
                return {};
            return doc.profile || {};
        });
    }
    updateProfile(userId, profile) {
        return __awaiter(this, void 0, void 0, function* () {
            const $set = {};
            if (typeof profile.displayName === "string") {
                $set["profile.displayName"] = profile.displayName;
            }
            if (typeof profile.bio === "string") {
                $set["profile.bio"] = profile.bio;
            }
            if (Array.isArray(profile.specialties)) {
                $set["profile.specialties"] = profile.specialties;
            }
            if (typeof profile.experienceYears === "number") {
                $set["profile.experienceYears"] = profile.experienceYears;
            }
            if (typeof profile.licenseNumber === "string") {
                $set["profile.licenseNumber"] = profile.licenseNumber;
            }
            if (typeof profile.avatarUrl === "string") {
                $set["profile.avatarUrl"] = profile.avatarUrl;
            }
            if (typeof profile.consultationFee === "number") {
                $set["profile.consultationFee"] = profile.consultationFee;
            }
            if (Object.keys($set).length === 0) {
                const doc = yield this.model.findOne({ userId }).select("profile");
                if (!doc)
                    throw new Error("Doctor not found");
                return doc.profile || {};
            }
            const updated = yield this.model
                .findOneAndUpdate({ userId }, { $set }, { new: true, upsert: true })
                .select("profile");
            if (!updated)
                throw new Error("Doctor not found");
            return updated.profile || {};
        });
    }
    saveCertificateUrl(userId, certificateUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.model.findOne({ userId });
            if (!doc)
                throw new Error("Doctor not found");
            doc.verification.certificateUrl = certificateUrl;
            yield doc.save();
            return doc.verification;
        });
    }
    submitForReview(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.model.findOne({ userId });
            if (!doc)
                throw new Error("Doctor not found");
            doc.verification.status = "pending";
            doc.verification.submittedAt = new Date();
            doc.verification.rejectionReasons = [];
            yield doc.save();
            return doc;
        });
    }
    // ===== NEW: Sessions (bookings) aggregation =====
    listSessions(doctorId, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = Math.max(1, Number(opts.page) || 1);
            const limit = Math.min(50, Math.max(1, Number(opts.limit) || 10));
            const now = new Date();
            const startOfDay = new Date(now);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(now);
            endOfDay.setHours(23, 59, 59, 999);
            const baseMatch = { doctorId: new mongoose_1.Types.ObjectId(doctorId) };
            const addStartDT = {
                $addFields: {
                    startDT: { $dateFromString: { dateString: { $concat: ["$date", "T", "$time", ":00Z"] } } },
                },
            };
            const scopeMatch = opts.scope === "today"
                ? { startDT: { $gte: startOfDay, $lte: endOfDay } }
                : opts.scope === "past"
                    ? { startDT: { $lt: now } }
                    : { startDT: { $gte: now } };
            const qRegex = opts.q ? { $regex: opts.q, $options: "i" } : null;
            const pipeline = [
                { $match: baseMatch },
                addStartDT,
                { $match: scopeMatch },
                ...(opts.mode ? [{ $match: { mode: opts.mode } }] : []),
                {
                    $lookup: {
                        from: user_model_1.UserModel.collection.name,
                        localField: "patientId",
                        foreignField: "_id",
                        as: "patient",
                    },
                },
                { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
                ...(qRegex
                    ? [{ $match: { $or: [{ petName: qRegex }, { "patient.username": qRegex }, { "patient.email": qRegex }] } }]
                    : []),
                {
                    $project: {
                        _id: 1,
                        date: 1,
                        time: 1,
                        durationMins: 1,
                        mode: 1,
                        status: 1,
                        petName: 1,
                        notes: 1,
                        patientId: 1,
                        patientName: "$patient.username",
                        patientEmail: "$patient.email",
                        doctorId: 1,
                        slotId: 1,
                        amount: 1,
                        currency: 1,
                        startDT: 1,
                    },
                },
                { $sort: { startDT: 1 } },
                {
                    $facet: {
                        items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
                        total: [{ $count: "count" }],
                    },
                },
                { $project: { items: 1, total: { $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0] } } },
            ];
            const [r] = yield booking_schema_1.Booking.aggregate(pipeline).exec();
            return { items: (r === null || r === void 0 ? void 0 : r.items) || [], total: (r === null || r === void 0 ? void 0 : r.total) || 0 };
        });
    }
    getSession(doctorId, bookingId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(bookingId))
                return null;
            const rows = yield booking_schema_1.Booking.aggregate([
                { $match: { _id: new mongoose_1.Types.ObjectId(bookingId), doctorId: new mongoose_1.Types.ObjectId(doctorId) } },
                {
                    $lookup: {
                        from: user_model_1.UserModel.collection.name,
                        localField: "patientId",
                        foreignField: "_id",
                        as: "patient",
                    },
                },
                { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 1,
                        date: 1,
                        time: 1,
                        durationMins: 1,
                        mode: 1,
                        status: 1,
                        petName: 1,
                        notes: 1,
                        patientId: 1,
                        patientName: "$patient.username",
                        patientEmail: "$patient.email",
                        amount: 1,
                        currency: 1,
                        doctorId: 1,
                        slotId: 1,
                        createdAt: 1,
                    },
                },
                { $limit: 1 },
            ]).exec();
            return (rows === null || rows === void 0 ? void 0 : rows[0]) || null;
        });
    }
    doctorDashboard(doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const totalBookings = yield booking_schema_1.Booking.countDocuments({ doctorId });
            const totalEarningsAgg = yield payment_model_1.PaymentModel.aggregate([
                { $match: { doctorId, paymentStatus: "Success" } },
                { $group: { _id: null, sum: { $sum: "$doctorEarning" } } }
            ]);
            const totalEarnings = ((_a = totalEarningsAgg[0]) === null || _a === void 0 ? void 0 : _a.sum) || 0;
            return { totalBookings, totalEarnings };
        });
    }
    getBookingStatusCounts(doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = new mongoose_1.Types.ObjectId(doctorId);
            const result = yield booking_schema_1.Booking.aggregate([
                { $match: { doctorId: id } },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                    },
                },
            ]);
            // Initialize default structure
            const counts = {
                pending: 0,
                completed: 0,
                cancelled: 0,
            };
            // Map Mongo results to our structure
            result.forEach((item) => {
                if (item._id === "pending")
                    counts.pending = item.count;
                if (item._id === "paid")
                    counts.completed = item.count;
                if (item._id === "cancelled")
                    counts.cancelled = item.count;
            });
            return counts;
        });
    }
    getDashboardStats(doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const doctorObjId = new mongoose_1.default.Types.ObjectId(doctorId);
            // TODAY date range
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            // -----------------------------
            // 1. Appointments Today
            // -----------------------------
            const appointmentsToday = yield booking_schema_1.Booking.countDocuments({
                doctorId: doctorObjId,
                date: todayStart.toISOString().split("T")[0],
                status: { $in: ["pending", "paid"] }
            });
            // -----------------------------
            // 2. Unique Patients Count
            // -----------------------------
            const patientsResult = yield booking_schema_1.Booking.aggregate([
                { $match: { doctorId: doctorObjId, status: "paid" } },
                { $group: { _id: "$patientId" } }
            ]);
            const totalPatients = patientsResult.length;
            // -----------------------------
            // 3. Earnings This Month
            // -----------------------------
            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);
            const earningsMonthResult = yield payment_model_1.PaymentModel.aggregate([
                {
                    $match: {
                        doctorId: doctorObjId,
                        paymentStatus: "success",
                        createdAt: { $gte: monthStart }
                    }
                },
                { $group: { _id: null, total: { $sum: "$doctorEarning" } } }
            ]);
            const earningsThisMonth = ((_a = earningsMonthResult[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
            // -----------------------------
            // 4. Earnings Last 6 Months Graph
            // -----------------------------
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
            sixMonthsAgo.setDate(1);
            const graphData = yield payment_model_1.PaymentModel.aggregate([
                {
                    $match: {
                        doctorId: doctorObjId,
                        paymentStatus: "success",
                        createdAt: { $gte: sixMonthsAgo }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" }
                        },
                        total: { $sum: "$doctorEarning" }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } }
            ]);
            const months = graphData.map(e => new Date(e._id.year, e._id.month - 1).toLocaleString("en-US", { month: "short" }));
            const earnings = graphData.map(e => e.total);
            return {
                appointmentsToday,
                totalPatients,
                earningsThisMonth,
                chart: {
                    months,
                    earnings
                }
            };
        });
    }
    getDoctorBookingTrends(doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield booking_schema_1.Booking.aggregate([
                { $match: { doctorId: new mongoose_1.default.Types.ObjectId(doctorId), status: "paid" } },
                {
                    $lookup: {
                        from: "pets",
                        localField: "petName", // your Booking stores petName, not petId
                        foreignField: "name", // match by pet name
                        as: "petData"
                    }
                },
                { $unwind: "$petData" },
                {
                    $group: {
                        _id: "$petData.speciesCategoryName",
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                {
                    $project: {
                        _id: 0,
                        categoryName: "$_id",
                        count: 1
                    }
                }
            ]);
        });
    }
}
exports.DoctorRepository = DoctorRepository;
