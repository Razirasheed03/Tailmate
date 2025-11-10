import { Router } from "express";
import { NotificationController } from "../controllers/Implements/notification.controller";
import { authJwt } from "../middlewares/authJwt";
import { requireRole } from "../middlewares/requireRoles";
import { UserRole } from "../constants/roles";

const router = Router();

// Get my notifications (doctor/admin/user)
router.get("/notifications", authJwt, NotificationController.getMyNotifications);

// Get unread count
router.get("/notifications/unread-count", authJwt, NotificationController.getUnreadCount);

// Mark all as read
router.patch("/notifications/mark-all-read", authJwt, NotificationController.markAllAsRead);

// Mark single notification as read
router.patch("/notifications/:id/read", authJwt, NotificationController.markAsRead);

// Delete a notification (optional)
router.delete("/notifications/:id", authJwt, NotificationController.deleteNotification);

// Create notification (admin only)
router.post("/notifications", authJwt, requireRole([UserRole.ADMIN]), NotificationController.create);

export default router;