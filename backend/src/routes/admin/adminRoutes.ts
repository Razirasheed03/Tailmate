import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { adminController } from "../../dependencies/admin.di"; // You'll need to create this DI

const router = Router();

// User management routes
router.get("/users", asyncHandler(adminController.getAllUsers));
router.post("/users/:userId/block", asyncHandler(adminController.blockUser));
router.post("/users/:userId/unblock", asyncHandler(adminController.unblockUser));
router.delete("/users/:userId", asyncHandler(adminController.deleteUser));
router.get("/stats", asyncHandler(adminController.getUserStats));

export default router;
