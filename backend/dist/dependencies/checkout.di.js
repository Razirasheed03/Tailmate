"use strict";
// dependencies/checkout.di.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutController = void 0;
const checkout_controller_1 = require("../controllers/Implements/checkout.controller");
const checkout_service_1 = require("../services/implements/checkout.service");
const doctorPublic_repository_1 = require("../repositories/implements/doctorPublic.repository");
exports.checkoutController = new checkout_controller_1.CheckoutController(new checkout_service_1.CheckoutService(new doctorPublic_repository_1.DoctorPublicRepository()));
