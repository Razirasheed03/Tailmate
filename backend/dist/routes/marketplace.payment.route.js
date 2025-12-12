"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/marketplace.payment.route.ts
const express_1 = require("express");
const authJwt_1 = require("../middlewares/authJwt");
const marketplace_payment_controller_1 = require("../controllers/Implements/marketplace.payment.controller");
const router = (0, express_1.Router)();
router.post("/create-checkout-session", authJwt_1.authJwt, marketplace_payment_controller_1.MarketplacePaymentController.createSession);
exports.default = router;
