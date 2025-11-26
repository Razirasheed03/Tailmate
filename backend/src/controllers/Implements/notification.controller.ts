//controller/notification.controller.ts
import { Request, Response } from "express";
import { NotificationModel } from "../../schema/notification.schema";
import { Types } from "mongoose";

export const NotificationController = {
  // GET /api/notifications?role=admin OR doctor OR...
  getMyNotifications: async (req: Request, res: Response) => {
    const userId = (req as any).user?._id;
    const userRole = (req as any).user?.role;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    let match: any = { userId, userRole: userRole || "doctor" };
    if (userRole === "admin" && req.query.forUser) {
      match = { userId: req.query.forUser };
    }

    const list = await NotificationModel.find(match)
      .sort({ createdAt: -1 })
      .limit(Number(req.query.limit) || 20)
      .lean();
    return res.json({ data: list });
  },

  // POST /api/notifications (create a notification for any user/role)
  create: async (req: Request, res: Response) => {
    const { userId, userRole, type, message, meta } = req.body;
    if (!userId || !userRole || !type || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const notif = await NotificationModel.create({
      userId,
      userRole,
      type,
      message,
      meta: meta || {},
      read: false,
    });
    return res.json({ data: notif });
  },

  // PATCH /api/notifications/mark-all-read
  markAllAsRead: async (req: Request, res: Response) => {
    const userId = (req as any).user?._id;
    const userRole = (req as any).user?.role;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const result = await NotificationModel.updateMany(
      { userId, userRole, read: false },
      { $set: { read: true } }
    );

    return res.json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  },

  // PATCH /api/notifications/:id/read
  markAsRead: async (req: Request, res: Response) => {
    const userId = (req as any).user?._id;
    const notificationId = req.params.id;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }

    const notification = await NotificationModel.findOneAndUpdate(
      { _id: notificationId, userId }, // Ensure user owns this notification
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json({ success: true, data: notification });
  },

  // DELETE /api/notifications/:id (optional - to delete a notification)
  deleteNotification: async (req: Request, res: Response) => {
    const userId = (req as any).user?._id;
    const notificationId = req.params.id;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }

    const notification = await NotificationModel.findOneAndDelete({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json({ success: true, message: "Notification deleted" });
  },

  // GET /api/notifications/unread-count
  getUnreadCount: async (req: Request, res: Response) => {
    const userId = (req as any).user?._id;
    const userRole = (req as any).user?.role;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const count = await NotificationModel.countDocuments({
      userId,
      userRole,
      read: false,
    });

    return res.json({ count });
  },
};