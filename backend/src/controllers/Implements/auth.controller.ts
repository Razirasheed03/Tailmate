import { NextFunction, Request, Response } from "express";
import { IAuthService } from "../../services/interfaces/auth.service.interface";
import { signupSchema } from "../../validation/userSchemas";

// OPTIONAL (only if you want server-redirect OAuth):
import { OAuth2Client } from "google-auth-library";

export class AuthController {
  constructor(private readonly _authService: IAuthService) { }

  signup = async (req: Request, res: Response, next: NextFunction) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0].message,
        errors: parsed.error.issues,
      });
    }
    const { username, email, password, role } = parsed.data;
    try {
      const result = await this._authService.signup(parsed.data);
      res.status(201).json(result);
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
      res.cookie("refreshToken", refreshToken, {
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

  // ADD: Google login with ID token from frontend (One Tap / Credential mode)
  googleLoginWithToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { idToken } = req.body;
      const { accessToken, refreshToken, user } = await this._authService.googleLogin(idToken);

      res
        .cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        .status(200)
        .json({ success: true, accessToken, user });
    } catch (err) {
      next(err);
    }
  };


  googleRedirect = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const client = new OAuth2Client({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: process.env.GOOGLE_REDIRECT_URI!,
      });

      const scopes = ["openid", "profile", "email"];
      const url = client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: scopes,
      });
      res.redirect(url);
    } catch (err) {
      next(err);
    }
  };

  googleCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = req.query.code as string;
      if (!code) {
        return res.status(400).json({ success: false, message: "Missing code" });
      }

      const client = new OAuth2Client({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: process.env.GOOGLE_REDIRECT_URI!,
      });

      const { tokens } = await client.getToken(code);
      const idToken = tokens.id_token;
      if (!idToken) {
        return res.status(400).json({ success: false, message: "No id_token from Google" });
      }

      const { accessToken, refreshToken, user } = await this._authService.googleLogin(idToken);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const frontendUrl = `${process.env.FRONTEND_BASE_URL}/login?accessToken=${encodeURIComponent(
        accessToken
      )}&user=${encodeURIComponent(JSON.stringify({
        _id: (user as any)._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }))}`;

      res.redirect(302, frontendUrl);
    } catch (err) {
      next(err);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      await this._authService.forgotPassword(email);
      res.status(200).json({ success: true, message: "If this email is registered, a reset link has been sent." });
    } catch (err) {
      next(err);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, token, newPassword } = req.body;
      await this._authService.resetPassword(id, token, newPassword);
      res.status(200).json({ success: true, message: "Password reset successful." });
    } catch (err) {
      next(err);
    }
  };
}
