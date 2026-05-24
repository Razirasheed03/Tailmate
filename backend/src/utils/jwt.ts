import jwt from "jsonwebtoken";
import { env } from "../config/env";

/**
 * Generate access token with proper payload structure
 * @param userId - User._id (always present)
 * @param role - "user" | "doctor" | "admin"
 * @param doctorId - Doctor._id (only for doctors)
 */
export function generateAccessToken(userId: string, role?: string, doctorId?: string) {
  const payload = {
    id: userId,
    role: role || "user",
    doctorId: doctorId || null,
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(userId: string) {
  return jwt.sign({ id: userId }, env.REFRESH_SECRET, { expiresIn: "7d" });
}
