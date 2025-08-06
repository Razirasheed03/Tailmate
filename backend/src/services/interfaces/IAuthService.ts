import { IUser } from "../../models/interfaces/IUser";

export interface IAuthService {
  signup(user: IUser): Promise<{ message: string }>;
  verifyOtp(email: string, otp: string): Promise<{ token: string; user: IUser }>;
    resendOtp(email: string): Promise<void>;
}
