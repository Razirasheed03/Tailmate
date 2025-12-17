"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/payout.route.ts
const express_1 = require("express");
const authJwt_1 = require("../middlewares/authJwt");
const asyncHandler_1 = require("../utils/asyncHandler");
const payout_di_1 = require("../dependencies/payout.di");
const router = (0, express_1.Router)();
const c = payout_di_1.payoutController;
router.use(authJwt_1.authJwt);
router.post("/payout/request", (0, asyncHandler_1.asyncHandler)((req, res, next) => c.requestPayout(req, res, next)));
router.get("/payout/history", (0, asyncHandler_1.asyncHandler)((req, res, next) => c.listMyPayouts(req, res, next)));
exports.default = router;
