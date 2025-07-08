"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const AuthController_1 = require("../controllers/auth/AuthController");
const UserRepository_1 = require("../repositories/implements/UserRepository");
const AuthService_1 = require("../services/implements/AuthService");
exports.authController = new AuthController_1.AuthController(new AuthService_1.AuthService(new UserRepository_1.UserRepository()));
