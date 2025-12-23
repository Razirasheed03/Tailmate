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
exports.MarketplaceRepository = void 0;
//repositories/implements/marketplace.repository.ts
const mongoose_1 = require("mongoose");
const marketplaceListing_schema_1 = require("../../schema/marketplaceListing.schema");
class MarketplaceRepository {
    constructor(model = marketplaceListing_schema_1.MarketplaceListing) {
        this.model = model;
    }
    create(userId, body) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!body.petId)
                throw Object.assign(new Error("petId is required"), { status: 400 });
            const doc = yield this.model.create(Object.assign(Object.assign({}, body), { userId: new mongoose_1.Types.ObjectId(userId), sellerId: new mongoose_1.Types.ObjectId(userId), petId: new mongoose_1.Types.ObjectId(body.petId), type: body.price === null || body.price === undefined ? 'adopt' : 'sell', history: [
                    {
                        action: 'created',
                        by: new mongoose_1.Types.ObjectId(userId),
                        meta: { price: (_a = body.price) !== null && _a !== void 0 ? _a : null, place: body.place },
                    },
                ] }));
            return doc.toObject();
        });
    }
    listPublic(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const { page, limit } = params;
            const filter = { deletedAt: null, status: 'active' };
            // Existing filters
            if (params.type === 'sell' || params.type === 'adopt')
                filter.type = params.type;
            if ((_a = params.place) === null || _a === void 0 ? void 0 : _a.trim())
                filter.place = { $regex: params.place.trim(), $options: 'i' };
            if ((_b = params.q) === null || _b === void 0 ? void 0 : _b.trim()) {
                const q = params.q.trim();
                filter.$or = [
                    { title: { $regex: q, $options: 'i' } },
                    { description: { $regex: q, $options: 'i' } },
                    { place: { $regex: q, $options: 'i' } },
                ];
            }
            // ✅ NEW: Price filtering logic
            if (params.minPrice !== undefined || params.maxPrice !== undefined || params.excludeFree) {
                const priceFilter = {};
                if (params.excludeFree) {
                    // Exclude free items (price = null or 0)
                    priceFilter.$ne = null;
                    priceFilter.$gt = 0;
                }
                if (params.minPrice !== undefined) {
                    if (params.excludeFree) {
                        priceFilter.$gte = params.minPrice;
                    }
                    else {
                        // Include free items but filter paid items by minimum price
                        filter.$or = [
                            { price: null }, // Free items
                            { price: { $gte: params.minPrice } }
                        ];
                    }
                }
                if (params.maxPrice !== undefined) {
                    if (filter.$or) {
                        // If we already have $or for free items, update it
                        filter.$or = [
                            { price: null },
                            {
                                price: {
                                    $gte: params.minPrice || 0,
                                    $lte: params.maxPrice
                                }
                            }
                        ];
                    }
                    else {
                        priceFilter.$lte = params.maxPrice;
                    }
                }
                if (!filter.$or && Object.keys(priceFilter).length > 0) {
                    filter.price = priceFilter;
                }
            }
            // ✅ NEW: Sorting logic
            let sort = { createdAt: -1 }; // default: newest first
            switch (params.sortBy) {
                case 'oldest':
                    sort = { createdAt: 1 };
                    break;
                case 'price_low':
                    sort = { price: 1, createdAt: -1 };
                    break;
                case 'price_high':
                    sort = { price: -1, createdAt: -1 };
                    break;
                case 'title_az':
                    sort = { title: 1, createdAt: -1 };
                    break;
                case 'title_za':
                    sort = { title: -1, createdAt: -1 };
                    break;
                default:
                    sort = { createdAt: -1 };
            }
            const skip = (page - 1) * limit;
            const [data, total] = yield Promise.all([
                this.model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
                this.model.countDocuments(filter),
            ]);
            return { data, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
        });
    }
    listMine(userId, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const filter = { userId: new mongoose_1.Types.ObjectId(userId), deletedAt: null };
            const skip = (page - 1) * limit;
            const [data, total] = yield Promise.all([
                this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
                this.model.countDocuments(filter),
            ]);
            return { data, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
        });
    }
    update(userId, id, patch) {
        return __awaiter(this, void 0, void 0, function* () {
            const _id = new mongoose_1.Types.ObjectId(id);
            const owner = new mongoose_1.Types.ObjectId(userId);
            const set = {};
            const allowed = ['title', 'description', 'price', 'ageText', 'place', 'contact', 'photos', 'status'];
            for (const k of allowed) {
                if (k in patch)
                    set[k] = patch[k];
            }
            if ('price' in patch)
                set.type = patch.price === null || patch.price === undefined ? 'adopt' : 'sell';
            const updated = yield this.model.findOneAndUpdate({ _id, userId: owner, deletedAt: null }, {
                $set: set,
                $push: {
                    history: {
                        action: 'updated',
                        by: owner,
                        meta: { changed: Object.keys(set) },
                    },
                },
            }, { new: true, runValidators: true, context: 'query' }).lean();
            return updated;
        });
    }
    changeStatus(userId, id, status) {
        return __awaiter(this, void 0, void 0, function* () {
            const _id = new mongoose_1.Types.ObjectId(id);
            const owner = new mongoose_1.Types.ObjectId(userId);
            const updated = yield this.model.findOneAndUpdate({ _id, userId: owner, deletedAt: null }, {
                $set: { status },
                $push: { history: { action: 'status_changed', by: owner, meta: { status } } },
            }, { new: true }).lean();
            return updated;
        });
    }
    remove(userId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const _id = new mongoose_1.Types.ObjectId(id);
            const owner = new mongoose_1.Types.ObjectId(userId);
            const res = yield this.model.findOneAndUpdate({ _id, userId: owner, deletedAt: null }, {
                $set: { deletedAt: new Date(), status: 'closed' },
                $push: { history: { action: 'deleted', by: owner } },
            }, { new: false });
            return !!res;
        });
    }
}
exports.MarketplaceRepository = MarketplaceRepository;
