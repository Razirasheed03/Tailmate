"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutController = void 0;
// backend/src/dependencies/checkout.di.ts
const checkout_controller_1 = require("../controllers/Implements/checkout.controller");
const checkout_service_1 = require("../services/implements/checkout.service");
const checkoutService = new checkout_service_1.CheckoutService();
exports.checkoutController = new checkout_controller_1.CheckoutController(checkoutService);
