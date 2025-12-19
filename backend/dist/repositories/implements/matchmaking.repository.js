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
exports.MatchmakingRepository = void 0;
//matchmaking.repository.ts
const mongoose_1 = require("mongoose");
const matchmaking_schema_1 = require("../../schema/matchmaking.schema");
class MatchmakingRepository {
    constructor(model = matchmaking_schema_1.MatchmakingListing) {
        this.model = model;
    }
    create(userId, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.model.create(Object.assign(Object.assign({}, body), { userId: new mongoose_1.Types.ObjectId(userId), petId: new mongoose_1.Types.ObjectId(body.petId), latitude: body.latitude, longitude: body.longitude, location: {
                    type: "Point",
                    coordinates: [body.longitude, body.latitude], // [lng, lat]
                }, history: [
                    {
                        action: "created",
                        by: new mongoose_1.Types.ObjectId(userId),
                        meta: { place: body.place },
                    },
                ] }));
            return doc.toObject();
        });
    }
    listPublic(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { page, limit } = params;
            const filter = {
                deletedAt: null,
                status: "active",
            };
            // -----------------------------------------------------
            // TEXT SEARCH
            // -----------------------------------------------------
            if ((_a = params.q) === null || _a === void 0 ? void 0 : _a.trim()) {
                const q = params.q.trim();
                filter.$or = [
                    { title: { $regex: q, $options: "i" } },
                    { description: { $regex: q, $options: "i" } },
                    { place: { $regex: q, $options: "i" } },
                ];
            }
            // -----------------------------------------------------
            // GEO RADIUS FILTER
            // -----------------------------------------------------
            if (typeof params.lat === "number" &&
                typeof params.lng === "number" &&
                typeof params.radius === "number" &&
                params.radius > 0) {
                const radiusInRadians = params.radius / 6371; // Earth radius km
                filter.location = {
                    $geoWithin: {
                        $centerSphere: [[params.lng, params.lat], radiusInRadians],
                    },
                };
            }
            // -----------------------------------------------------
            // SORTING
            // -----------------------------------------------------
            let sort = { createdAt: -1 };
            switch (params.sortBy) {
                case "oldest":
                    sort = { createdAt: 1 };
                    break;
                case "title_az":
                    sort = { title: 1 };
                    break;
                case "title_za":
                    sort = { title: -1 };
                    break;
            }
            const skip = (page - 1) * limit;
            const [data, total] = yield Promise.all([
                this.model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
                this.model.countDocuments(filter),
            ]);
            return {
                data,
                total,
                page,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            };
        });
    }
    listMine(userId, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const filter = {
                userId: new mongoose_1.Types.ObjectId(userId),
                deletedAt: null,
            };
            const skip = (page - 1) * limit;
            const [data, total] = yield Promise.all([
                this.model
                    .find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                this.model.countDocuments(filter),
            ]);
            return {
                data,
                total,
                page,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            };
        });
    }
    update(userId, id, patch) {
        return __awaiter(this, void 0, void 0, function* () {
            const updated = yield this.model
                .findOneAndUpdate({
                _id: new mongoose_1.Types.ObjectId(id),
                userId: new mongoose_1.Types.ObjectId(userId),
                deletedAt: null,
            }, {
                $set: patch,
                $push: {
                    history: {
                        action: "updated",
                        by: new mongoose_1.Types.ObjectId(userId),
                        meta: { changed: Object.keys(patch) },
                    },
                },
            }, { new: true, runValidators: true })
                .lean();
            return updated;
        });
    }
    changeStatus(userId, id, status) {
        return __awaiter(this, void 0, void 0, function* () {
            const updated = yield this.model
                .findOneAndUpdate({
                _id: new mongoose_1.Types.ObjectId(id),
                userId: new mongoose_1.Types.ObjectId(userId),
                deletedAt: null,
            }, {
                $set: { status },
                $push: {
                    history: {
                        action: "status_changed",
                        by: new mongoose_1.Types.ObjectId(userId),
                        meta: { status },
                    },
                },
            }, { new: true })
                .lean();
            return updated;
        });
    }
    remove(userId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.model.findOneAndUpdate({
                _id: new mongoose_1.Types.ObjectId(id),
                userId: new mongoose_1.Types.ObjectId(userId),
                deletedAt: null,
            }, {
                $set: { deletedAt: new Date(), status: "closed" },
                $push: {
                    history: {
                        action: "deleted",
                        by: new mongoose_1.Types.ObjectId(userId),
                    },
                },
            });
            return !!res;
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield this.model
                .findOne({
                _id: new mongoose_1.Types.ObjectId(id),
                deletedAt: null,
            })
                .lean();
            return doc;
        });
    }
}
exports.MatchmakingRepository = MatchmakingRepository;
