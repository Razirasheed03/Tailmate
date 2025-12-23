"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payoutController = void 0;
const payout_controller_1 = require("../controllers/Implements/payout.controller");
const payout_service_1 = require("../services/implements/payout.service");
exports.payoutController = new payout_controller_1.PayoutController(new payout_service_1.PayoutService());
