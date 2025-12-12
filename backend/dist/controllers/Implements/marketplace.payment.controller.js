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
exports.MarketplacePaymentController = void 0;
const ResponseHelper_1 = require("../../http/ResponseHelper");
const messageConstant_1 = require("../../constants/messageConstant");
const marketplace_payment_service_1 = require("../../services/implements/marketplace.payment.service");
const svc = new marketplace_payment_service_1.MarketplacePaymentService();
exports.MarketplacePaymentController = {
    createSession: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const uid = ((_b = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = req === null || req === void 0 ? void 0 : req.user) === null || _c === void 0 ? void 0 : _c.id);
        if (!uid)
            return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
        try {
            const data = yield svc.createCheckoutSession(req.body, uid);
            return ResponseHelper_1.ResponseHelper.ok(res, data, messageConstant_1.HttpResponse.RESOURCE_FOUND);
        }
        catch (err) {
            const e = err;
            return ResponseHelper_1.ResponseHelper.badRequest(res, (e === null || e === void 0 ? void 0 : e.message) || "Failed");
        }
    }),
};
