//middlewares/authJwt.ts
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/implements/user.model";

export const authJwt: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role?: string;
      doctorId?: string | null;
    };


    const user = await UserModel.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid token user." });
    }


    const userId = (user as any)._id?.toString() || decoded.id;
    (req as any).user = {
      _id: userId,                    
      id: userId,                
      role: decoded.role || (user as any).role,
      doctorId: decoded.doctorId || null,
    };

    next();
  } catch (error: any) {
    if (error?.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired." });
    }
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
};
