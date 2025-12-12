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
exports.requestPayout = requestPayout;
exports.listMyPayouts = listMyPayouts;
const payout_service_1 = require("../../services/implements/payout.service");
const ResponseHelper_1 = require("../../http/ResponseHelper");
const messageConstant_1 = require("../../constants/messageConstant");
const svc = new payout_service_1.PayoutService();
// POST /payout/request
function requestPayout(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const uid = ((_b = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = req === null || req === void 0 ? void 0 : req.user) === null || _c === void 0 ? void 0 : _c.id);
        if (!uid)
            return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
        try {
            // Use request body safely
            const { ownerType = "user", amount, currency = "INR" } = typeof req.body === "object" ? req.body : {};
            if (!ownerType || !amount)
                return ResponseHelper_1.ResponseHelper.badRequest(res, "Missing ownerType or amount");
            // All payouts initiated by logged-in user for themself
            const payout = yield svc.requestPayout(ownerType, uid, amount, currency);
            return ResponseHelper_1.ResponseHelper.ok(res, payout, messageConstant_1.HttpResponse.RESOURCE_FOUND);
        }
        catch (err) {
            return ResponseHelper_1.ResponseHelper.badRequest(res, (err === null || err === void 0 ? void 0 : err.message) || "Failed to create payout");
        }
    });
}
function listMyPayouts(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const uid = ((_b = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = req === null || req === void 0 ? void 0 : req.user) === null || _c === void 0 ? void 0 : _c.id);
        if (!uid)
            return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
        try {
            const ownerType = typeof req.query.ownerType === "string" ? req.query.ownerType : "user";
            const rows = yield svc.listPayouts(ownerType, uid);
            return ResponseHelper_1.ResponseHelper.ok(res, rows, messageConstant_1.HttpResponse.RESOURCE_FOUND);
        }
        catch (err) {
            return ResponseHelper_1.ResponseHelper.badRequest(res, (err === null || err === void 0 ? void 0 : err.message) || "Failed to list payouts");
        }
    });
}
