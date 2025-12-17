"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/checkout.routes.ts
const express_1 = require("express");
const asyncHandler_1 = require("../utils/asyncHandler");
const authJwt_1 = require("../middlewares/authJwt");
const checkout_di_1 = require("../dependencies/checkout.di");
const router = (0, express_1.Router)();
// Auth required for checkout flows
router.use(authJwt_1.authJwt);
// POST /api/checkout/quote  -> compute pricing (tax/discounts)
router.post("/quote", (0, asyncHandler_1.asyncHandler)(checkout_di_1.checkoutController.getQuote));
// POST /api/checkout/create -> create booking + payment session (pending)
router.post("/create", (0, asyncHandler_1.asyncHandler)(checkout_di_1.checkoutController.createCheckout));
exports.default = router;
