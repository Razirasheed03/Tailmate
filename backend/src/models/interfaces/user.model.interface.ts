import { Document } from "mongoose";
import { UserRole } from "../../constants/roles";


export interface IUserModel extends Document {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  isBlocked?: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
