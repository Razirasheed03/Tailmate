import { NextFunction, Request, Response } from "express";
import { IAuthService } from "../../services/interfaces/IAuthService";

export class AuthController {

  constructor(
    private readonly _authService: IAuthService
  ) { }


  signup = async (req: Request, res: Response, next: NextFunction) => {

    try {
      const user = await this._authService.signup(req.body);
      res.status(201).json({ success: true, user });
    } catch (err) {
      console.log(err)
      next(err)
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

