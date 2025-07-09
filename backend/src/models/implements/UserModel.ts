import { Schema, model, Document } from "mongoose";
import { IUser } from "../interfaces/IUser";

export interface IUserDoc extends IUser, Document { } // ✅ extend Document correctly

const UserSchema = new Schema<IUserDoc>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

export const UserModel = model<IUserDoc>("User", UserSchema); // ✅ matches IUserDoc
