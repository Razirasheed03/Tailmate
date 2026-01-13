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
exports.ConsultationRepository = void 0;
//consultation.repository.ts
const mongoose_1 = require("mongoose");
const consultation_schema_1 = require("../../schema/consultation.schema");
class ConsultationRepository {
    constructor(model = consultation_schema_1.Consultation) {
        this.model = model;
    }
    /**
     * Populate consultation with user and doctor details
     * userId: User document
     * doctorId: Doctor document with nested userId (User document)
     */
    populate(query) {
        return query
            .populate("userId", "_id username email")
            .populate({
            path: "doctorId",
            model: "Doctor",
            populate: {
                path: "userId",
                model: "User",
                select: "_id username email"
            }
        });
    }
    create(userId, doctorProfileId, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.model.create({
                userId: new mongoose_1.Types.ObjectId(userId),
                doctorId: new mongoose_1.Types.ObjectId(doctorProfileId),
                scheduledFor: body.scheduledFor,
                durationMinutes: body.durationMinutes || 30,
                notes: body.notes || null,
            });
            return doc.toObject();
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.populate(this.model.findById(id));
            if (!doc)
                return null;
            const obj = doc.toObject();
            console.log("[findById] Populated consultation:", {
                _id: obj._id,
                userId: obj.userId,
                doctorId: obj.doctorId,
            });
            return obj;
        });
    }
    findByIdAndUpdate(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.populate(this.model.findByIdAndUpdate(id, updates, { new: true }));
            return doc ? doc.toObject() : null;
        });
    }
    findByVideoRoomId(videoRoomId) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.populate(this.model.findOne({ videoRoomId }));
            return doc ? doc.toObject() : null;
        });
    }
    findByBookingId(bookingId) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.populate(this.model.findOne({
                bookingId: bookingId,
                status: { $nin: ["cancelled", "cancelled_by_doctor"] },
            }));
            return doc ? doc.toObject() : null;
        });
    }
    deleteByBookingId(bookingId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.model.deleteOne({ _id: bookingId });
        });
    }
    findOneAndUpsert(filter, updates, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.populate(this.model.findOneAndUpdate(filter, updates, Object.assign(Object.assign({}, options), { new: true })));
            return doc ? doc.toObject() : null;
        });
    }
    listUserConsultations(userId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            const filter = { userId: new mongoose_1.Types.ObjectId(userId) };
            if (status)
                filter.status = status;
            const docs = yield this.populate(this.model.find(filter).sort({ scheduledFor: -1 }));
            return docs.map((d) => d.toObject());
        });
    }
    listDoctorConsultations(doctorProfileId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            const filter = { doctorId: new mongoose_1.Types.ObjectId(doctorProfileId) };
            if (status)
                filter.status = status;
            const docs = yield this.populate(this.model.find(filter).sort({ scheduledFor: -1 }));
            return docs.map((d) => d.toObject());
        });
    }
    findUpcomingConsultations() {
        return __awaiter(this, arguments, void 0, function* (minutesBefore = 5) {
            const now = new Date();
            const futureTime = new Date(now.getTime() + minutesBefore * 60000);
            const docs = yield this.populate(this.model.find({
                status: "upcoming",
                scheduledFor: { $lte: futureTime, $gte: now },
                videoRoomId: null,
            }));
            return docs.map((d) => d.toObject());
        });
    }
    findActiveConsultations(consultationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.populate(this.model.findOne({
                _id: new mongoose_1.Types.ObjectId(consultationId),
                status: { $in: ["upcoming", "in_progress"] },
            }));
            return doc ? doc.toObject() : null;
        });
    }
    cancel(id, cancelledBy, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.populate(this.model.findByIdAndUpdate(id, {
                status: "cancelled",
                cancelledBy: new mongoose_1.Types.ObjectId(cancelledBy),
                cancelledAt: new Date(),
                cancellationReason: reason,
            }, { new: true }));
            return doc ? doc.toObject() : null;
        });
    }
    updateById(id, update) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(id)) {
                return null;
            }
            return this.model
                .findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { $set: update }, { new: true })
                .lean();
        });
    }
}
exports.ConsultationRepository = ConsultationRepository;
