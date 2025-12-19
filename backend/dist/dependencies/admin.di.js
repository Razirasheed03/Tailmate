"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = void 0;
// src/dependencies/admin.di.ts
const admin_controller_1 = require("../controllers/Implements/admin.controller");
const admin_service_1 = require("../services/implements/admin.service");
const user_repository_1 = require("../repositories/implements/user.repository");
const admin_repository_1 = require("../repositories/implements/admin.repository");
exports.adminController = new admin_controller_1.AdminController(new admin_service_1.AdminService(new user_repository_1.UserRepository(), new admin_repository_1.AdminRepository()));
