//middlewares/authJwt.ts
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/implements/user.model";
import { Doctor } from "../schema/doctor.schema";
import { env } from "../config/env";

export const authJwt: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
    };

    const user = await UserModel.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid token user." });
    }
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        code: "USER_BLOCKED",
        message: "Your account has been blocked by admin.",
      });
    }

    const userId = (user as any)._id?.toString() || decoded.id;
    const role = user.role;

    let doctorId: string | null = null;
    if (role === "doctor") {
      const doctor = await Doctor.findOne({ userId: user._id }).select("_id").lean();
      doctorId = doctor?._id?.toString() || null;
    }

    (req as any).user = {
      _id: userId,
      id: userId,
      role,
      doctorId,
    };

    next();
  } catch (error: any) {
    if (error?.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired." });
    }
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
};
