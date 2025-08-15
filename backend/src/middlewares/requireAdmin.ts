import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/implements/user.model";
import { UserRole } from "../constants/roles";

export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "Access denied. No token provided." });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    const user = await UserModel.findById(decoded.id);
    if (!user || user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, message: "Access denied. Admin only." });
      return;
    }

    (req as any).user = user;
    next();
  } catch (error: any) {
    if (error?.name === "TokenExpiredError") {
      res.status(401).json({ success: false, message: "Token expired." });
      return;
    }
    res.status(401).json({ success: false, message: "Invalid token." });
  }
};
