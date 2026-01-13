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
exports.BookingRepository = void 0;
// backend/src/repositories/implements/booking.repository.ts
const mongoose_1 = require("mongoose");
const booking_schema_1 = require("../../schema/booking.schema");
class BookingRepository {
    constructor(model = booking_schema_1.Booking) {
        this.model = model;
    }
    create(attrs) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const doc = yield this.model.create({
                patientId: new mongoose_1.Types.ObjectId(attrs.patientId),
                doctorId: new mongoose_1.Types.ObjectId(attrs.doctorId),
                slotId: attrs.slotId ? new mongoose_1.Types.ObjectId(attrs.slotId) : null,
                date: attrs.date,
                time: attrs.time,
                durationMins: attrs.durationMins,
                mode: attrs.mode,
                amount: attrs.amount,
                currency: attrs.currency,
                petName: attrs.petName,
                notes: (_a = attrs.notes) !== null && _a !== void 0 ? _a : "",
                paymentMethod: attrs.paymentMethod,
                status: "pending",
                paymentProvider: (_b = attrs.paymentProvider) !== null && _b !== void 0 ? _b : "",
                paymentSessionId: (_c = attrs.paymentSessionId) !== null && _c !== void 0 ? _c : "",
                paymentRedirectUrl: (_d = attrs.paymentRedirectUrl) !== null && _d !== void 0 ? _d : "",
            });
            return doc.toObject();
        });
    }
    markPaid(bookingId, sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(bookingId))
                return null;
            const _id = new mongoose_1.Types.ObjectId(bookingId);
            const updated = yield this.model
                .findOneAndUpdate({ _id, status: "pending" }, { $set: { status: "paid", paymentSessionId: sessionId !== null && sessionId !== void 0 ? sessionId : "" } }, { new: true })
                .lean() // enforce lean shape
                .exec();
            return updated !== null && updated !== void 0 ? updated : null;
        });
    }
    updateStatus(bookingId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(bookingId))
                return null;
            const _id = new mongoose_1.Types.ObjectId(bookingId);
            const updated = yield this.model
                .findByIdAndUpdate(_id, { $set: { status } }, { new: true })
                .lean() // enforce lean shape
                .exec();
            return updated !== null && updated !== void 0 ? updated : null;
        });
    }
    findById(bookingId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!mongoose_1.Types.ObjectId.isValid(bookingId))
                return null;
            const _id = new mongoose_1.Types.ObjectId(bookingId);
            const row = yield this.model.findById(_id, null, { lean: true }).exec();
            return (_a = row) !== null && _a !== void 0 ? _a : null;
        });
    }
    listUserBookings(params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(params.userId)) {
                return { items: [], total: 0 };
            }
            const patientId = new mongoose_1.Types.ObjectId(params.userId);
            const skip = (params.page - 1) * params.limit;
            // Build date filter based on scope
            const today = new Date().toISOString().split("T")[0];
            const dateFilter = {};
            switch (params.scope) {
                case "today":
                    dateFilter.date = today;
                    break;
                case "upcoming":
                    dateFilter.date = { $gte: today };
                    break;
                case "past":
                    dateFilter.date = { $lt: today };
                    break;
                case "all":
                default:
                    // no date filter
                    break;
            }
            // Build query
            const query = Object.assign({ patientId }, dateFilter);
            if (params.status) {
                query.status = params.status;
            }
            if (params.mode) {
                query.mode = params.mode;
            }
            // Search filter (pet name or notes)
            if (params.q && params.q.trim()) {
                query.$or = [
                    { petName: { $regex: params.q.trim(), $options: "i" } },
                    { notes: { $regex: params.q.trim(), $options: "i" } },
                ];
            }
            // Execute query with doctor info population
            const items = yield this.model
                .find(query)
                .populate({
                path: "doctorId",
                select: "username email profile.specialty profile.profilePic",
            })
                .sort({ date: -1, time: -1 })
                .skip(skip)
                .limit(params.limit)
                .lean()
                .exec();
            const total = yield this.model.countDocuments(query).exec();
            // Transform results to include doctor details
            const transformed = items.map((item) => {
                var _a, _b;
                const doctor = item.doctorId || {};
                return {
                    _id: item._id.toString(),
                    patientId: item.patientId.toString(),
                    doctorId: typeof item.doctorId === "object" ? item.doctorId._id.toString() : item.doctorId.toString(),
                    doctorName: doctor.username || "Unknown Doctor",
                    doctorSpecialty: ((_a = doctor.profile) === null || _a === void 0 ? void 0 : _a.specialty) || "",
                    doctorProfilePic: ((_b = doctor.profile) === null || _b === void 0 ? void 0 : _b.profilePic) || "",
                    slotId: item.slotId ? item.slotId.toString() : null,
                    date: item.date,
                    time: item.time,
                    durationMins: item.durationMins,
                    mode: item.mode,
                    amount: item.amount,
                    currency: item.currency,
                    petName: item.petName,
                    notes: item.notes || "",
                    paymentMethod: item.paymentMethod,
                    status: item.status,
                    paymentProvider: item.paymentProvider || "",
                    paymentSessionId: item.paymentSessionId || "",
                    bookingNumber: item.bookingNumber,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                };
            });
            return { items: transformed, total };
        });
    }
    // /**
    //  * Get a single user booking by ID with doctor details
    //  */
    getUserBookingById(userId, bookingId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!mongoose_1.Types.ObjectId.isValid(userId) || !mongoose_1.Types.ObjectId.isValid(bookingId)) {
                return null;
            }
            const patientId = new mongoose_1.Types.ObjectId(userId);
            const _id = new mongoose_1.Types.ObjectId(bookingId);
            const item = yield this.model
                .findOne({ _id, patientId })
                .populate({
                path: "doctorId",
                select: "username email profile.specialty profile.profilePic",
            })
                .lean()
                .exec();
            if (!item)
                return null;
            const doctor = item.doctorId || {};
            return {
                _id: item._id.toString(),
                patientId: item.patientId.toString(),
                doctorId: typeof item.doctorId === "object" ? item.doctorId._id.toString() : item.doctorId.toString(),
                doctorName: doctor.username || "Unknown Doctor",
                doctorSpecialty: ((_a = doctor.profile) === null || _a === void 0 ? void 0 : _a.specialty) || "",
                doctorProfilePic: ((_b = doctor.profile) === null || _b === void 0 ? void 0 : _b.profilePic) || "",
                slotId: item.slotId ? item.slotId.toString() : null,
                date: item.date,
                time: item.time,
                durationMins: item.durationMins,
                mode: item.mode,
                amount: item.amount,
                currency: item.currency,
                petName: item.petName,
                notes: item.notes || "",
                paymentMethod: item.paymentMethod,
                status: item.status,
                paymentProvider: item.paymentProvider || "",
                paymentSessionId: item.paymentSessionId || "",
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            };
        });
    }
    /**
     * Cancel a user booking (only if status is 'paid')
     */
    cancelUserBooking(userId, bookingId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userId) || !mongoose_1.Types.ObjectId.isValid(bookingId)) {
                return null;
            }
            const patientId = new mongoose_1.Types.ObjectId(userId);
            const _id = new mongoose_1.Types.ObjectId(bookingId);
            const updated = yield this.model
                .findOneAndUpdate({ _id, patientId, status: "paid" }, { $set: { status: "cancelled" } }, { new: true })
                .lean()
                .exec();
            return updated !== null && updated !== void 0 ? updated : null;
        });
    }
    updateBookingStatus(bookingId, newStatus, session) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(bookingId))
                return null;
            return yield this.model
                .findByIdAndUpdate(bookingId, { $set: { status: newStatus } }, { new: true, session })
                .lean();
        });
    }
}
exports.BookingRepository = BookingRepository;
