"use strict";
// dependencies/payment.di.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentController = void 0;
const payment_controller_1 = require("../controllers/Implements/payment.controller");
const payment_repository_1 = require("../repositories/implements/payment.repository");
const payment_service_1 = require("../services/implements/payment.service");
exports.paymentController = new payment_controller_1.PaymentController(new payment_service_1.PaymentService(new payment_repository_1.PaymentRepository()));
