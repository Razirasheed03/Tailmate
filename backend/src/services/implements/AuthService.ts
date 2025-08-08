import { IAuthService } from "../interfaces/IAuthService";
import { IUserRepository } from "../../repositories/interfaces/IUserRepository";
import { IUser } from "../../models/interfaces/IUser";
import bcrypt from "bcryptjs";
import redisClient from "../../config/redisClient";
import { randomInt } from "crypto";
import { sendOtpEmail } from "../../utils/sendEmail";
import type { SignupInput } from "../../validation/userSchemas";
import jwt, { JwtPayload } from "jsonwebtoken";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt";

export class AuthService implements IAuthService {
  constructor(private _userRepo: IUserRepository) { }

  signup = async (user: Omit<SignupInput, "confirmPassword">): Promise<{ message: string }> => {
    const existing = await this._userRepo.findByEmail(user.email);
    if (existing) throw new Error("User already exists");

    const otp = randomInt(100000, 999999).toString();
    const hashedPassword = await bcrypt.hash(user.password, 10);

    const key = `signup:${user.email}`;
    const createdAt = Date.now();
    await redisClient.setEx(
      key,
      300,
      JSON.stringify({ ...user, password: hashedPassword, otp, createdAt })
    );
    await sendOtpEmail(user.email, otp);

    return { message: "OTP sent to email. Please verify." };
  };

  verifyOtp = async (email: string, otp: string): Promise<{ accessToken: string; refreshToken: string; user: IUser }> => {
    const key = `signup:${email}`;
    const redisData = await redisClient.get(key);
    console.log("redis key in verifyOtp", redisData)
    if (!redisData) throw new Error("OTP expired or not found");
    const parsed = JSON.parse(redisData);
    if (!parsed.createdAt || Date.now() - parsed.createdAt > 30 * 1000) {
      throw new Error("OTP expired");
    }
    if (parsed.otp !== otp) throw new Error("Invalid OTP");


    const { otp: _, ...userData } = parsed;
    const createdUser = await this._userRepo.createUser(userData);
    console.log("VALUES for verification:",
      "Submitted OTP:", otp,
      "Redis object:", parsed,
      "CreatedAt diff (ms):", Date.now() - parsed.createdAt
    );


    // const token = jwt.sign({ id: createdUser._id }, process.env.JWT_SECRET!, { expiresIn: "1d" });
    // await redisClient.del(key);

    // return { token, user: createdUser };
    const accessToken = generateAccessToken(createdUser._id.toString());
    const refreshToken = generateRefreshToken(createdUser._id.toString());

    // Store refreshToken in Redis for validation/revocation
    await redisClient.setEx(
      `refresh:${createdUser._id}`,
      7 * 24 * 60 * 60, // 7 days in seconds
      refreshToken
    );
    await redisClient.del(key);
    // Return both tokens
    return { accessToken, refreshToken, user: createdUser };
  };
  resendOtp = async (email: string) => {
    const key = `signup:${email}`;
    const redisData = await redisClient.get(key);
    console.log('Redis after resend: ', redisData);
    if (!redisData) throw new Error("OTP expired or not found, signup again.");

    const parsed = JSON.parse(redisData);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    parsed.otp = otp;
    parsed.createdAt = Date.now();
    await redisClient.setEx(key, 300, JSON.stringify(parsed)); //5 min for resended otp set aavan.
    console.log("parsed.createdAT", parsed.createdAt)

    await sendOtpEmail(email, otp);
  };
  refreshToken = async (refreshToken: string): Promise<{ accessToken: string }> => {
    if (!refreshToken) throw new Error("No refresh token provided");

    let payload: string | JwtPayload;
    try {
      payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET!);
    } catch {
      throw new Error("Refresh token invalid or expired");
    }

    // Type check and extract user id from payload
    let userId: string;
    if (typeof payload === "object" && payload && "id" in payload) {
      userId = (payload as JwtPayload & { id: string }).id;
    } else {
      throw new Error("Invalid refresh token payload - user id missing.");
    }

    // Check against Redis
    const storedToken = await redisClient.get(`refresh:${userId}`);
    if (storedToken !== refreshToken) throw new Error("Refresh token is revoked or does not match");

    // Generate new access token
    const accessToken = generateAccessToken(userId);
    return { accessToken };
  };
login = async (email: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: IUser }> => {
  const user = await this._userRepo.findByEmail(email);
  if (!user) throw new Error("Invalid email or password");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid email or password");

  const userId = user._id.toString();
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);

  await redisClient.setEx(`refresh:${userId}`, 7 * 24 * 60 * 60, refreshToken);

  return { accessToken, refreshToken, user };
};


  


}
