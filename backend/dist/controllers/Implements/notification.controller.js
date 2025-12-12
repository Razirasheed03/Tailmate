"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notification_schema_1 = require("../../schema/notification.schema");
const mongoose_1 = require("mongoose");
exports.NotificationController = {
    // GET /api/notifications?role=admin OR doctor OR...
    getMyNotifications: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        let match = { userId, userRole: userRole || "doctor" };
        if (userRole === "admin" && req.query.forUser) {
            match = { userId: req.query.forUser };
        }
        const list = yield notification_schema_1.NotificationModel.find(match)
            .sort({ createdAt: -1 })
            .limit(Number(req.query.limit) || 20)
            .lean();
        return res.json({ data: list });
    }),
    // POST /api/notifications (create a notification for any user/role)
    create: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { userId, userRole, type, message, meta } = req.body;
        if (!userId || !userRole || !type || !message) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const notif = yield notification_schema_1.NotificationModel.create({
            userId,
            userRole,
            type,
            message,
            meta: meta || {},
            read: false,
        });
        return res.json({ data: notif });
    }),
    // PATCH /api/notifications/mark-all-read
    markAllAsRead: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const result = yield notification_schema_1.NotificationModel.updateMany({ userId, userRole, read: false }, { $set: { read: true } });
        return res.json({
            success: true,
            message: "All notifications marked as read",
            modifiedCount: result.modifiedCount,
        });
    }),
    // PATCH /api/notifications/:id/read
    markAsRead: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const notificationId = req.params.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        if (!mongoose_1.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({ message: "Invalid notification ID" });
        }
        const notification = yield notification_schema_1.NotificationModel.findOneAndUpdate({ _id: notificationId, userId }, // Ensure user owns this notification
        { $set: { read: true } }, { new: true });
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        return res.json({ success: true, data: notification });
    }),
    // DELETE /api/notifications/:id (optional - to delete a notification)
    deleteNotification: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const notificationId = req.params.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        if (!mongoose_1.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({ message: "Invalid notification ID" });
        }
        const notification = yield notification_schema_1.NotificationModel.findOneAndDelete({
            _id: notificationId,
            userId,
        });
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        return res.json({ success: true, message: "Notification deleted" });
    }),
    // GET /api/notifications/unread-count
    getUnreadCount: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const count = yield notification_schema_1.NotificationModel.countDocuments({
            userId,
            userRole,
            read: false,
        });
        return res.json({ count });
    }),
};
