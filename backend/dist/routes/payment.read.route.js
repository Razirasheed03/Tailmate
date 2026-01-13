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
const express_1 = require("express");
const payment_model_1 = require("../models/implements/payment.model");
const router = (0, express_1.Router)();
router.get("/payments/by-booking/:bookingId", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bookingId = req.params.bookingId;
        const row = yield payment_model_1.PaymentModel
            .findOne({ bookingId, paymentStatus: "success" })
            .select("_id bookingId amount platformFee doctorEarning currency paymentStatus createdAt")
            .lean();
        const fallback = row
            ? null
            : yield payment_model_1.PaymentModel
                .findOne({ bookingId })
                .sort({ createdAt: -1 })
                .select("_id bookingId amount platformFee doctorEarning currency paymentStatus createdAt")
                .lean();
        const found = row || fallback;
        if (!found)
            return res.status(404).json({ success: false, message: "Not found" });
        res.json({ success: true, data: found });
    }
    catch (e) {
        next(e);
    }
}));
exports.default = router;
