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
exports.MarketplaceService = void 0;
// backend/src/services/implements/marketplace.service.ts
const marketplace_repository_1 = require("../../repositories/implements/marketplace.repository");
class MarketplaceService {
    constructor(_repo = new marketplace_repository_1.MarketplaceRepository()) {
        this._repo = _repo;
    }
    create(userId, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            if (!payload.petId)
                throw Object.assign(new Error("petId is required"), { status: 400 });
            if (!((_a = payload.title) === null || _a === void 0 ? void 0 : _a.trim()))
                throw Object.assign(new Error("Title is required"), { status: 400 });
            if (!((_b = payload.description) === null || _b === void 0 ? void 0 : _b.trim()))
                throw Object.assign(new Error("Description is required"), { status: 400 });
            if (!((_c = payload.place) === null || _c === void 0 ? void 0 : _c.trim()))
                throw Object.assign(new Error("Place is required"), { status: 400 });
            if (!((_d = payload.contact) === null || _d === void 0 ? void 0 : _d.trim()))
                throw Object.assign(new Error("Contact is required"), { status: 400 });
            if (!Array.isArray(payload.photos))
                payload.photos = [];
            if (payload.photos.length > 6)
                throw Object.assign(new Error("Max 6 photos"), { status: 400 });
            return this._repo.create(userId, {
                petId: payload.petId,
                title: payload.title.trim(),
                description: payload.description.trim(),
                photos: payload.photos,
                price: (_e = payload.price) !== null && _e !== void 0 ? _e : null,
                ageText: ((_f = payload.ageText) === null || _f === void 0 ? void 0 : _f.trim()) || "",
                place: payload.place.trim(),
                contact: payload.contact.trim(),
            });
        });
    }
    listPublic(page, limit, type, q, place, priceOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            page = Math.max(1, Number(page) || 1);
            limit = Math.min(50, Math.max(1, Number(limit) || 10));
            const res = yield this._repo.listPublic({
                page,
                limit,
                type,
                q,
                place,
                minPrice: priceOptions === null || priceOptions === void 0 ? void 0 : priceOptions.minPrice,
                maxPrice: priceOptions === null || priceOptions === void 0 ? void 0 : priceOptions.maxPrice,
                excludeFree: priceOptions === null || priceOptions === void 0 ? void 0 : priceOptions.excludeFree,
                sortBy: priceOptions === null || priceOptions === void 0 ? void 0 : priceOptions.sortBy,
            });
            return {
                data: res.data,
                total: res.total,
                page: res.page,
                totalPages: res.totalPages,
            };
        });
    }
    listMine(userId, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            page = Math.max(1, Number(page) || 1);
            limit = Math.min(50, Math.max(1, Number(limit) || 10));
            const res = yield this._repo.listMine(userId, page, limit);
            return {
                data: res.data,
                total: res.total,
                page: res.page,
                totalPages: res.totalPages,
            };
        });
    }
    update(userId, id, patch) {
        if ((patch === null || patch === void 0 ? void 0 : patch.title) && String(patch.title).trim().length < 3)
            throw Object.assign(new Error("Title too short"), { status: 400 });
        if ((patch === null || patch === void 0 ? void 0 : patch.description) && String(patch.description).trim().length < 10)
            throw Object.assign(new Error("Description too short"), { status: 400 });
        if ("photos" in patch && Array.isArray(patch.photos) && patch.photos.length > 6)
            throw Object.assign(new Error("Max 6 photos"), { status: 400 });
        return this._repo.update(userId, id, patch);
    }
    changeStatus(userId, id, status) {
        var _a;
        const statusMap = {
            active: "active",
            inactive: "reserved",
            sold: "closed",
            adopted: "closed",
            reserved: "reserved",
            closed: "closed",
        };
        const mappedStatus = (_a = statusMap[status]) !== null && _a !== void 0 ? _a : "active";
        return this._repo.changeStatus(userId, id, mappedStatus);
    }
    markAsComplete(userId, id, status) {
        return this._repo.changeStatus(userId, id, "closed");
    }
    remove(userId, id) {
        return this._repo.remove(userId, id);
    }
}
exports.MarketplaceService = MarketplaceService;
