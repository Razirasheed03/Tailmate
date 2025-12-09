"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//routes/payment.route.ts
const express_1 = require("express");
const payment_controller_1 = require("../controllers/Implements/payment.controller");
const authJwt_1 = require("../middlewares/authJwt");
const router = (0, express_1.Router)();
// webhook: raw body mount in server.ts for this path
router.post("/webhook", payment_controller_1.PaymentController.webhook);
// auth routes
router.post("/create-checkout-session", authJwt_1.authJwt, payment_controller_1.PaymentController.createSession);
router.get("/doctor", authJwt_1.authJwt, payment_controller_1.PaymentController.doctorPayments);
exports.default = router;
