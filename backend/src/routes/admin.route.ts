// src/routes/admin/admin.routes.ts
import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { adminController } from "../dependencies/admin.di";
import { requireRole } from "../middlewares/requireRoles";
import { UserRole } from "../constants/roles";
import { authJwt } from "../middlewares/authJwt";

const router = Router();

// Protect entire admin router
router.use(authJwt);
router.use(requireRole([UserRole.ADMIN]));

// User management routes
router.get("/users", asyncHandler(adminController.getAllUsers));
router.post("/users/:userId/block", asyncHandler(adminController.blockUser));
router.post("/users/:userId/unblock", asyncHandler(adminController.unblockUser));
router.delete("/users/:userId", asyncHandler(adminController.deleteUser));
router.get("/stats", asyncHandler(adminController.getUserStats));

// NEW: doctor moderation routes
router.get("/doctors", asyncHandler(adminController.listDoctors));
router.post("/doctors/:userId/verify", asyncHandler(adminController.verifyDoctor));
router.post("/doctors/:userId/reject", asyncHandler(adminController.rejectDoctor));
router.get("/doctors/:userId", asyncHandler(adminController.getDoctorDetail));

///Admin
router.get('/pet-categories', asyncHandler(adminController.listPetCategories));
router.post('/pet-categories', asyncHandler(adminController.createPetCategory));
router.patch('/pet-categories/:id', asyncHandler(adminController.updatePetCategory));
router.delete('/pet-categories/:id', asyncHandler(adminController.deletePetCategory));

export default router;
