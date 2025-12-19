"use strict";
// controllers/Implements/checkout.controller.ts
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
exports.CheckoutController = void 0;
const ResponseHelper_1 = require("../../http/ResponseHelper");
const messageConstant_1 = require("../../constants/messageConstant");
class CheckoutController {
    constructor(checkoutService) {
        this.checkoutService = checkoutService;
        this.getQuote = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const uid = ((_b = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = req === null || req === void 0 ? void 0 : req.user) === null || _c === void 0 ? void 0 : _c.id);
            if (!uid) {
                return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
            }
            try {
                const result = yield this.checkoutService.getQuote(uid, req.body);
                return ResponseHelper_1.ResponseHelper.ok(res, result, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (e) {
                const status = (e === null || e === void 0 ? void 0 : e.status) || 500;
                return ResponseHelper_1.ResponseHelper.error(res, status, "QUOTE_ERROR", (e === null || e === void 0 ? void 0 : e.message) || "Failed to get quote");
            }
        });
        this.createCheckout = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const uid = ((_b = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = req === null || req === void 0 ? void 0 : req.user) === null || _c === void 0 ? void 0 : _c.id);
            if (!uid) {
                return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
            }
            try {
                const result = yield this.checkoutService.createCheckout(uid, req.body);
                return ResponseHelper_1.ResponseHelper.ok(res, result, messageConstant_1.HttpResponse.RESOURCE_UPDATED);
            }
            catch (e) {
                const status = (e === null || e === void 0 ? void 0 : e.status) || 500;
                return ResponseHelper_1.ResponseHelper.error(res, status, "CHECKOUT_ERROR", (e === null || e === void 0 ? void 0 : e.message) || "Failed to create checkout");
            }
        });
    }
}
exports.CheckoutController = CheckoutController;
