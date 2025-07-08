import { IUser } from "../../models/interfaces/IUser";

export interface IAuthService {
  signup(user: IUser): Promise<IUser>;
}
