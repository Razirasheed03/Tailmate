import { Request, Response } from "express";
import { NotificationModel } from "../../schema/notification.schema";

export const NotificationController = {
  // GET /api/notifications?role=admin OR doctor OR...
  getMyNotifications: async (req: Request, res: Response) => {
    const userId = (req as any).user?._id;
    const userRole = (req as any).user?.role; // assuming your JWT middleware sets .role!
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Optional: allow admin to query for any user/role
    let match: any = { userId, userRole: userRole || "doctor" };
    if (userRole === "admin" && req.query.forUser) {
      match = { userId: req.query.forUser }; // e.g. for admin panels
    }

    const list = await NotificationModel.find(match)
      .sort({ createdAt: -1 })
      .limit(Number(req.query.limit) || 20)
      .lean();
    return res.json({ data: list });
  },

  // POST /api/notifications   (create a notification for any user/role)
  create: async (req: Request, res: Response) => {
    const { userId, userRole, type, message, meta } = req.body;
    if (!userId || !userRole || !type || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const notif = await NotificationModel.create({
      userId, userRole, type, message, meta: meta || {}, read: false,
    });
    return res.json({ data: notif });
  },
};
