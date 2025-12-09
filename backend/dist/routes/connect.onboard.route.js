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
// backend/src/routes/connect.onboard.route.ts
const express_1 = require("express");
const stripe_1 = require("../utils/stripe");
// import Doctor model and persist the connected account id on successful onboarding
const router = (0, express_1.Router)();
// POST /api/connect/accounts (create account and onboarding link)
router.post("/connect/accounts", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1) Create Standard connected account and request capabilities
        const account = yield stripe_1.stripe.accounts.create({
            type: "standard",
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
        });
        // 2) Create onboarding link
        const link = yield stripe_1.stripe.accountLinks.create({
            account: account.id,
            type: "account_onboarding",
            refresh_url: `${process.env.APP_URL}/connect/refresh`,
            return_url: `${process.env.APP_URL}/connect/return`,
        });
        // TODO: store account.id (acct_...) on the doctor record after return_url check
        return res.json({ success: true, data: { accountId: account.id, url: link.url } });
    }
    catch (err) {
        next(err);
    }
}));
exports.default = router;
