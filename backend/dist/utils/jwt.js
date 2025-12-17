"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Generate access token with proper payload structure
 * @param userId - User._id (always present)
 * @param role - "user" | "doctor" | "admin"
 * @param doctorId - Doctor._id (only for doctors)
 */
function generateAccessToken(userId, role, doctorId) {
    const payload = {
        id: userId, // User._id
        role: role || "user",
        doctorId: doctorId || null, // Doctor._id if role === "doctor"
    };
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
}
function generateRefreshToken(userId) {
    return jsonwebtoken_1.default.sign({ id: userId }, process.env.REFRESH_SECRET, { expiresIn: "7d" });
}
