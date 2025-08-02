"use strict";
//////router layer
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_di_1 = require("../../dependencies/auth.di");
const router = (0, express_1.Router)();
router.post("/signup", auth_di_1.authController.signup);
router.post("/verify-otp", auth_di_1.authController.verifyOtp);
exports.default = router;
