"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../../controllers/auth/AuthController");
const router = (0, express_1.Router)();
router.post("/signup", AuthController_1.signup);
exports.default = router;
