"use strict";
// controllers/implements/payment.controller.ts
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
exports.PaymentController = void 0;
const ResponseHelper_1 = require("../../http/ResponseHelper");
const messageConstant_1 = require("../../constants/messageConstant");
class PaymentController {
    constructor(paymentService) {
        this.paymentService = paymentService;
        this.createSession = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const uid = ((_b = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = req === null || req === void 0 ? void 0 : req.user) === null || _c === void 0 ? void 0 : _c.id);
            if (!uid) {
                return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
            }
            try {
                const data = yield this.paymentService.createCheckoutSession(req.body, uid);
                return ResponseHelper_1.ResponseHelper.ok(res, data, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (e) {
                return ResponseHelper_1.ResponseHelper.badRequest(res, (e === null || e === void 0 ? void 0 : e.message) || "Failed");
            }
        });
        this.webhook = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.paymentService.processWebhook(req);
                return ResponseHelper_1.ResponseHelper.ok(res, { received: true }, messageConstant_1.HttpResponse.RESOURCE_UPDATED);
            }
            catch (err) {
                return ResponseHelper_1.ResponseHelper.error(res, 400, "WEBHOOK_ERROR", `Webhook error: ${(err === null || err === void 0 ? void 0 : err.message) || "Unknown error"}`);
            }
        });
        this.doctorPayments = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const did = ((_b = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = req === null || req === void 0 ? void 0 : req.user) === null || _c === void 0 ? void 0 : _c.id);
            if (!did) {
                return ResponseHelper_1.ResponseHelper.unauthorized(res, messageConstant_1.HttpResponse.UNAUTHORIZED);
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const sortBy = req.query.sortBy || 'createdAt';
            const order = req.query.order || 'desc';
            const result = yield this.paymentService.doctorPayments(did, {
                page,
                limit,
                sortBy,
                order
            });
            return ResponseHelper_1.ResponseHelper.ok(res, result, messageConstant_1.HttpResponse.RESOURCE_FOUND);
        });
    }
}
exports.PaymentController = PaymentController;
