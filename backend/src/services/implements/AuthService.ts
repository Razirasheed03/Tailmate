import { IAuthService } from "../interfaces/IAuthService";
import { IUserRepository } from "../../repositories/interfaces/IUserRepository";
import { IUser } from "../../models/interfaces/IUser";
import bcrypt from "bcryptjs";
import redisClient from "../../config/redisClient";
import { randomInt } from "crypto";
import { sendOtpEmail } from "../../utils/sendEmail";
import type { SignupInput } from "../../validation/userSchemas";
import jwt from "jsonwebtoken";

export class AuthService implements IAuthService {
  constructor(private _userRepo: IUserRepository) {}

  signup = async (user: Omit<SignupInput, "confirmPassword">): Promise<{ message: string }> => {
    const existing = await this._userRepo.findByEmail(user.email);
    if (existing) throw new Error("User already exists");

    const otp = randomInt(100000, 999999).toString();
    const hashedPassword = await bcrypt.hash(user.password, 10);

    const key = `signup:${user.email}`;
    await redisClient.setEx(key, 300, JSON.stringify({ ...user, password: hashedPassword, otp }));
    await sendOtpEmail(user.email, otp);

    return { message: "OTP sent to email. Please verify." };
  };

  verifyOtp = async (email: string, otp: string): Promise<{ token: string; user: IUser }> => {
    const key = `signup:${email}`;
    const redisData = await redisClient.get(key);

    if (!redisData) throw new Error("OTP expired or not found");
    const parsed = JSON.parse(redisData);

    if (parsed.otp !== otp) throw new Error("Invalid OTP");

    const { otp: _, ...userData } = parsed; // Remove OTP property
    const createdUser = await this._userRepo.createUser(userData);

    const token = jwt.sign({ id: createdUser._id }, process.env.JWT_SECRET!, { expiresIn: "1d" });
    await redisClient.del(key);

    return { token, user: createdUser };
  };
}
  