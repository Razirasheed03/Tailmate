import { NextFunction, Request, Response } from "express";
import { IAuthService } from "../../services/interfaces/auth.service.interface";
import { signupSchema } from "../../validation/userSchemas";
import { OAuth2Client } from "google-auth-library";
import { CookieHelper } from "../../utils/cookie.helper";
import { HttpStatus } from "../../constants/httpStatus";

export class AuthController {
  constructor(private readonly _authService: IAuthService) {}

  signup = async (req: Request, res: Response, next: NextFunction) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: parsed.error.issues[0].message,
        errors: parsed.error.issues,
      });
    }
    try {
      const result = await this._authService.signup(parsed.data);
      res.status(HttpStatus.CREATED).json(result);
    } catch (err) {
      next(err);
    }
  };

  verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, otp } = req.body;
      const { accessToken, refreshToken, user } =
        await this._authService.verifyOtp(email, otp);
      CookieHelper.setRefreshToken(res, refreshToken) // CHANGED HERE
        .status(HttpStatus.OK)
        .json({ success: true, accessToken, user });
    } catch (err) {
      next(err);
    }
  };

  resendOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      await this._authService.resendOtp(email);
      res.status(HttpStatus.OK).json({ success: true, message: "OTP resent!" });
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
      const { accessToken, refreshToken, user } = await this._authService.login(
        email,
        password
      );
      CookieHelper.setRefreshToken(res, refreshToken) // Changed here (for show ing in review)
        .status(HttpStatus.OK)
        .json({ success: true, accessToken, user });
    } catch (err) {
      next(err);
    }
  };

  googleLoginWithToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { idToken } = req.body;
      const { accessToken, refreshToken, user } =
        await this._authService.googleLogin(idToken);

      CookieHelper.setRefreshToken(res, refreshToken)
        .status(HttpStatus.OK)
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
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ success: false, message: "Missing code" });
      }

      const client = new OAuth2Client({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: process.env.GOOGLE_REDIRECT_URI!,
      });

      const { tokens } = await client.getToken(code);
      const idToken = tokens.id_token;
      if (!idToken) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ success: false, message: "No id_token from Google" });
      }

      const { accessToken, refreshToken, user } =
        await this._authService.googleLogin(idToken);
      CookieHelper.setRefreshToken(res, refreshToken);

      const frontendUrl = `${
        process.env.FRONTEND_BASE_URL
      }/login?accessToken=${encodeURIComponent(
        accessToken
      )}&user=${encodeURIComponent(
        JSON.stringify({
          _id: (user as any)._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isBlocked: user.isBlocked,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })
      )}`;

      res.redirect(302, frontendUrl);
    } catch (err) {
      next(err);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      await this._authService.forgotPassword(email);
      res
        .status(HttpStatus.OK)
        .json({
          success: true,
          message: "If this email is registered, a reset link has been sent.",
        });
    } catch (err) {
      next(err);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, token, newPassword } = req.body;
      await this._authService.resetPassword(id, token, newPassword);
      res
        .status(HttpStatus.OK)
        .json({ success: true, message: "Password reset successful." });
    } catch (err) {
      next(err);
    }
  };
}
