import { IUser } from "../../models/interfaces/IUser";

export interface IAuthService {
  signup(user: IUser): Promise<{ success:boolean,message: string }>;
  verifyOtp(email: string, otp: string): Promise<{ accessToken: string; refreshToken: string; user: IUser }>;
  resendOtp(email: string): Promise<void>;
  refreshToken(refreshToken: string): Promise<{ accessToken: string }>;
  login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: IUser }>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(id: string, token: string, newPassword: string): Promise<void>;
}
