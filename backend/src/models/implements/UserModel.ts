import { Schema, model, Document, Types } from "mongoose";
import { IUser } from "../interfaces/IUser";

export interface IUserDoc extends IUser, Document {
  _id: Types.ObjectId;
}

const UserSchema = new Schema<IUserDoc>(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const UserModel = model<IUserDoc>("User", UserSchema);
