"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/payout.route.ts
const express_1 = require("express");
const router = (0, express_1.Router)();
const payout_controller_1 = require("../controllers/Implements/payout.controller");
router.post("/payout/request", payout_controller_1.requestPayout);
router.get("/payout/history", payout_controller_1.listMyPayouts);
exports.default = router;
