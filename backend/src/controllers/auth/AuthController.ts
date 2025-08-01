import { NextFunction, Request, Response } from "express";
import { IAuthService } from "../../services/interfaces/IAuthService";
import { signupSchema, SignupInput } from "../../validation/userSchemas";

export class AuthController {

  constructor(
    private readonly _authService: IAuthService
  ) { }

  signup = async (req: Request, res: Response, next: NextFunction) => {
    // 1. Zod validation FIRST
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      // Send the first error to frontend (or list all errors as an array)
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0].message,
        errors: parsed.error.issues, // Optionally: send all errors
      });
    }

    // 2. Data is guaranteed valid and typed!
    const { username, email, password } = parsed.data;
    // If you want to keep confirmPassword out of your DB/user object, drop it here

    try {
      // Pass only the needed fields (without confirmPassword) to the service
      const user = await this._authService.signup({ username, email, password });
      res.status(201).json({ success: true, user });
    } catch (err) {
      next(err);
    }
  };
  verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, otp } = req.body;
      const result = await this._authService.verifyOtp(email, otp);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      console.error(err);
      next(err);
    }
  };


}

