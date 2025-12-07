import jwt from "jsonwebtoken";

/**
 * Generate access token with proper payload structure
 * @param userId - User._id (always present)
 * @param role - "user" | "doctor" | "admin"
 * @param doctorId - Doctor._id (only for doctors)
 */
export function generateAccessToken(userId: string, role?: string, doctorId?: string) {
  const payload = {
    id: userId,              // User._id
    role: role || "user",
    doctorId: doctorId || null,  // Doctor._id if role === "doctor"
  };
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "15m" });
}

export function generateRefreshToken(userId: string) {
  return jwt.sign({ id: userId }, process.env.REFRESH_SECRET!, { expiresIn: "7d" });
}
