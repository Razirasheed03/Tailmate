"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/admin/admin.routes.ts
const express_1 = require("express");
const asyncHandler_1 = require("../utils/asyncHandler");
const admin_di_1 = require("../dependencies/admin.di");
const requireRoles_1 = require("../middlewares/requireRoles");
const roles_1 = require("../constants/roles");
const authJwt_1 = require("../middlewares/authJwt");
const router = (0, express_1.Router)();
// Protect entire admin router
router.use(authJwt_1.authJwt);
router.use((0, requireRoles_1.requireRole)([roles_1.UserRole.ADMIN]));
// User management routes
router.get("/users", (0, asyncHandler_1.asyncHandler)(admin_di_1.adminController.getAllUsers));
router.post("/users/:userId/block", (0, asyncHandler_1.asyncHandler)(admin_di_1.adminController.blockUser));
router.post("/users/:userId/unblock", (0, asyncHandler_1.asyncHandler)(admin_di_1.adminController.unblockUser));
router.delete("/users/:userId", (0, asyncHandler_1.asyncHandler)(admin_di_1.adminController.deleteUser));
router.get("/stats", (0, asyncHandler_1.asyncHandler)(admin_di_1.adminController.getUserStats));
// NEW: doctor moderation routes
router.get("/doctors", (0, asyncHandler_1.asyncHandler)(admin_di_1.adminController.listDoctors));
router.post("/doctors/:userId/verify", (0, asyncHandler_1.asyncHandler)(admin_di_1.adminController.verifyDoctor));
router.post("/doctors/:userId/reject", (0, asyncHandler_1.asyncHandler)(admin_di_1.adminController.rejectDoctor));
router.get("/doctors/:userId", (0, asyncHandler_1.asyncHandler)(admin_di_1.adminController.getDoctorDetail));
///Admin
router.get('/pet-categories', (0, asyncHandler_1.asyncHandler)(admin_di_1.adminController.listPetCategories));
router.post('/pet-categories', (0, asyncHandler_1.asyncHandler)(admin_di_1.adminController.createPetCategory));
router.patch('/pet-categories/:id', (0, asyncHandler_1.asyncHandler)(admin_di_1.adminController.updatePetCategory));
router.delete('/pet-categories/:id', (0, asyncHandler_1.asyncHandler)(admin_di_1.adminController.deletePetCategory));
router.get("/wallet/earnings", (0, asyncHandler_1.asyncHandler)(admin_di_1.adminController.getAdminEarnings));
router.get("/dashboard-stats", (0, asyncHandler_1.asyncHandler)(admin_di_1.adminController.getAdminDashboardStats));
router.get("/income-by-month", (0, asyncHandler_1.asyncHandler)(admin_di_1.adminController.getIncomeByMonth));
router.get("/dashboard/status-chart", admin_di_1.adminController.getBookingStatusChart);
router.get("/earnings/filter", admin_di_1.adminController.getFilteredEarnings);
router.get("/simple-doctors", admin_di_1.adminController.getSimpleDoctorList);
router.get("/growth-stats", (0, asyncHandler_1.asyncHandler)(admin_di_1.adminController.getGrowthStats));
exports.default = router;
