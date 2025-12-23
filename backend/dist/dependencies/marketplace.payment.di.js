"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketplacePaymentController = void 0;
const marketplace_payment_controller_1 = require("../controllers/Implements/marketplace.payment.controller");
const marketplace_payment_service_1 = require("../services/implements/marketplace.payment.service");
exports.marketplacePaymentController = new marketplace_payment_controller_1.MarketplacePaymentController(new marketplace_payment_service_1.MarketplacePaymentService());
