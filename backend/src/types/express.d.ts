import { UserDocument } from "../models/interfaces/user.interface";

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument | null;
    }
  }
}
