"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/payment.routes.ts
const express_1 = require("express");
const payment_di_1 = require("../dependencies/payment.di");
const authJwt_1 = require("../middlewares/authJwt");
const router = (0, express_1.Router)();
// webhook: raw body mount in server.ts for this path
router.post("/webhook", payment_di_1.paymentController.webhook);
// auth routes
router.post("/create-checkout-session", authJwt_1.authJwt, payment_di_1.paymentController.createSession);
router.get("/doctor", authJwt_1.authJwt, payment_di_1.paymentController.doctorPayments);
exports.default = router;
