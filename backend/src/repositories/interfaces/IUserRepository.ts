import { IUser } from "../../models/interfaces/IUser";
import { IUserDoc } from "../../models/implements/UserModel";

export interface IUserRepository {
  createUser(user: IUser): Promise<IUserDoc>;
  findByEmail(email: string): Promise<IUserDoc | null>;
  findById(id: string): Promise<IUserDoc | null>; // <-- add this
}
