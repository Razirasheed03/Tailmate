"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/marketplace.payment.route.ts
const express_1 = require("express");
const authJwt_1 = require("../middlewares/authJwt");
const asyncHandler_1 = require("../utils/asyncHandler");
const marketplace_payment_di_1 = require("../dependencies/marketplace.payment.di");
const router = (0, express_1.Router)();
router.post("/create-checkout-session", authJwt_1.authJwt, (0, asyncHandler_1.asyncHandler)((req, res, next) => marketplace_payment_di_1.marketplacePaymentController.createSession(req, res)));
exports.default = router;
