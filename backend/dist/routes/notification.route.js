"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("../controllers/Implements/notification.controller");
const authJwt_1 = require("../middlewares/authJwt");
const requireRoles_1 = require("../middlewares/requireRoles");
const roles_1 = require("../constants/roles");
const router = (0, express_1.Router)();
// Get my notifications (doctor/admin/user)
router.get("/notifications", authJwt_1.authJwt, notification_controller_1.NotificationController.getMyNotifications);
// Get unread count
router.get("/notifications/unread-count", authJwt_1.authJwt, notification_controller_1.NotificationController.getUnreadCount);
// Mark all as read
router.patch("/notifications/mark-all-read", authJwt_1.authJwt, notification_controller_1.NotificationController.markAllAsRead);
// Mark single notification as read
router.patch("/notifications/:id/read", authJwt_1.authJwt, notification_controller_1.NotificationController.markAsRead);
// Delete a notification (optional)
router.delete("/notifications/:id", authJwt_1.authJwt, notification_controller_1.NotificationController.deleteNotification);
// Create notification (admin only)
router.post("/notifications", authJwt_1.authJwt, (0, requireRoles_1.requireRole)([roles_1.UserRole.ADMIN]), notification_controller_1.NotificationController.create);
exports.default = router;
