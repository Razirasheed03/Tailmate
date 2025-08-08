import { NextFunction, Request, Response } from "express";
import { IAuthService } from "../../services/interfaces/IAuthService";
import { signupSchema, SignupInput } from "../../validation/userSchemas";

export class AuthController {

  constructor(
    private readonly _authService: IAuthService
  ) { }

  signup = async (req: Request, res: Response, next: NextFunction) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0].message,
        errors: parsed.error.issues,
      });
    }

    const { username, email, password } = parsed.data;

    try {
      const user = await this._authService.signup({ username, email, password });
      res.status(201).json({ success: true, user });
    } catch (err) {
      next(err);
    }
  };
  verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, otp } = req.body;
      const { accessToken, refreshToken, user } = await this._authService.verifyOtp(email, otp);
      res
        .cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000
        })
        .status(200)
        .json({ success: true, accessToken, user });
    } catch (err) {
      console.error(err);
      next(err);
    }
  };
  resendOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      await this._authService.resendOtp(email);
      res.status(200).json({ success: true, message: "OTP resent!" });
    } catch (err) {
      next(err);
    }
  };
  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get from HTTP-only cookie or body
      const token = req.cookies.refreshToken || req.body.refreshToken;
      const { accessToken } = await this._authService.refreshToken(token);
      res.json({ success: true, accessToken });
    } catch (err) {
      next(err);
    }
  };
  login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await this._authService.login(email, password);
    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      .status(200)
      .json({ success: true, accessToken, user });
  } catch (err) {
    next(err);
  }
};




}

