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
const stripe_1 = require("../utils/stripe");
const router = (0, express_1.Router)();
router.get("/checkout/session/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const ses = yield stripe_1.stripe.checkout.sessions.retrieve(req.params.id);
        const payment_intent = typeof ses.payment_intent === "string"
            ? ses.payment_intent
            : ((_a = ses.payment_intent) === null || _a === void 0 ? void 0 : _a.id) || null;
        res.json({
            success: true,
            data: {
                id: ses.id,
                payment_status: ses.payment_status,
                payment_intent,
                // doctor booking passthrough
                bookingId: ((_b = ses.metadata) === null || _b === void 0 ? void 0 : _b.bookingId) || null,
                // marketplace passthrough
                kind: ((_c = ses.metadata) === null || _c === void 0 ? void 0 : _c.kind) || null,
                orderId: ((_d = ses.metadata) === null || _d === void 0 ? void 0 : _d.orderId) || null,
                listingId: ((_e = ses.metadata) === null || _e === void 0 ? void 0 : _e.listingId) || null,
            },
        });
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
