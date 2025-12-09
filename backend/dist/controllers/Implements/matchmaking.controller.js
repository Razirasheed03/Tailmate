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
exports.MatchmakingController = void 0;
const matchmaking_service_1 = require("../../services/implements/matchmaking.service");
const ResponseHelper_1 = require("../../http/ResponseHelper");
const messageConstant_1 = require("../../constants/messageConstant");
const svc = new matchmaking_service_1.MatchmakingService();
class MatchmakingController {
    constructor() {
        this.create = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                // const userId = (req as any).user?._id?.toString();
                const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                if (!userId)
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                const listing = yield svc.create(userId, req.body || {});
                return ResponseHelper_1.ResponseHelper.created(res, listing, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        this.listPublic = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 12;
                const q = req.query.q || "";
                const place = req.query.place || "";
                const sortBy = req.query.sortBy || "newest";
                const lat = req.query.lat ? Number(req.query.lat) : undefined;
                const lng = req.query.lng ? Number(req.query.lng) : undefined;
                const radius = req.query.radius ? Number(req.query.radius) : undefined;
                const result = yield svc.listPublic(page, limit, q, place, sortBy, lat, lng, radius);
                return ResponseHelper_1.ResponseHelper.ok(res, result, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        this.listMine = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                if (!userId)
                    return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 12;
                const result = yield svc.listMine(userId, page, limit);
                return ResponseHelper_1.ResponseHelper.ok(res, result, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                next(err);
            }
        });
        this.update = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                const id = req.params.id;
                const updated = yield svc.update(userId, id, req.body || {});
                if (!updated)
                    return ResponseHelper_1.ResponseHelper.notFound(res, messageConstant_1.HttpResponse.PAGE_NOT_FOUND);
                return ResponseHelper_1.ResponseHelper.ok(res, updated, messageConstant_1.HttpResponse.RESOURCE_UPDATED);
            }
            catch (err) {
                next(err);
            }
        });
        this.changeStatus = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                const id = req.params.id;
                const status = (_c = req.body) === null || _c === void 0 ? void 0 : _c.status;
                const validStatuses = ["active", "matched", "closed"];
                if (!validStatuses.includes(status))
                    return ResponseHelper_1.ResponseHelper.badRequest(res, "Invalid status");
                const updated = yield svc.changeStatus(userId, id, status);
                if (!updated)
                    return ResponseHelper_1.ResponseHelper.notFound(res, messageConstant_1.HttpResponse.PAGE_NOT_FOUND);
                return ResponseHelper_1.ResponseHelper.ok(res, updated, messageConstant_1.HttpResponse.RESOURCE_UPDATED);
            }
            catch (err) {
                next(err);
            }
        });
        this.remove = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
                const id = req.params.id;
                const ok = yield svc.remove(userId, id);
                if (!ok)
                    return ResponseHelper_1.ResponseHelper.notFound(res, messageConstant_1.HttpResponse.PAGE_NOT_FOUND);
                return ResponseHelper_1.ResponseHelper.noContent(res);
            }
            catch (err) {
                next(err);
            }
        });
    }
}
exports.MatchmakingController = MatchmakingController;
