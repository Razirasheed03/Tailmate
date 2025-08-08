"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler"); // path as appropriate
const auth_di_1 = require("../../dependencies/auth.di");
const router = (0, express_1.Router)();
router.post("/signup", (0, asyncHandler_1.asyncHandler)(auth_di_1.authController.signup));
router.post("/verify-otp", (0, asyncHandler_1.asyncHandler)(auth_di_1.authController.verifyOtp));
router.post("/resend-otp", (0, asyncHandler_1.asyncHandler)(auth_di_1.authController.resendOtp));
router.post("/login", (0, asyncHandler_1.asyncHandler)(auth_di_1.authController.login));
exports.default = router;
