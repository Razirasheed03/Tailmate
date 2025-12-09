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
exports.MatchmakingService = void 0;
const matchmaking_repository_1 = require("../../repositories/implements/matchmaking.repository");
class MatchmakingService {
    constructor(_repo = new matchmaking_repository_1.MatchmakingRepository()) {
        this._repo = _repo;
    }
    create(userId, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            if (!payload.petId)
                throw Object.assign(new Error("petId is required"), { status: 400 });
            if (!((_a = payload.title) === null || _a === void 0 ? void 0 : _a.trim()))
                throw Object.assign(new Error("Title is required"), { status: 400 });
            if (!((_b = payload.description) === null || _b === void 0 ? void 0 : _b.trim()))
                throw Object.assign(new Error("Description is required"), {
                    status: 400,
                });
            if (!((_c = payload.place) === null || _c === void 0 ? void 0 : _c.trim()))
                throw Object.assign(new Error("Place is required"), { status: 400 });
            if (!((_d = payload.contact) === null || _d === void 0 ? void 0 : _d.trim()))
                throw Object.assign(new Error("Contact is required"), { status: 400 });
            if (typeof payload.latitude !== "number" || typeof payload.longitude !== "number") {
                throw Object.assign(new Error("Valid location required"), { status: 400 });
            }
            if (!Array.isArray(payload.photos))
                payload.photos = [];
            if (payload.photos.length > 6)
                throw Object.assign(new Error("Max 6 photos allowed"), { status: 400 });
            return this._repo.create(userId, payload);
        });
    }
    listPublic(page, limit, q, place, sortBy, lat, lng, radius) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._repo.listPublic({
                page,
                limit,
                q,
                place,
                sortBy,
                lat,
                lng,
                radius
            });
        });
    }
    listMine(userId, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._repo.listMine(userId, page, limit);
        });
    }
    update(userId, id, patch) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._repo.update(userId, id, patch);
        });
    }
    changeStatus(userId, id, status) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._repo.changeStatus(userId, id, status);
        });
    }
    remove(userId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._repo.remove(userId, id);
        });
    }
}
exports.MatchmakingService = MatchmakingService;
