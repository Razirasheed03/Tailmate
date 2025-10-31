//user.schema.ts
import { Schema, model, Document, Types } from "mongoose";
import { UserRole } from "../constants/roles";
import { IUserModel } from "../models/interfaces/user.model.interface";

const UserSchema = new Schema<IUserModel>(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
      required: true
    },
    isBlocked: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

export const User = model<IUserModel>("User", UserSchema);
