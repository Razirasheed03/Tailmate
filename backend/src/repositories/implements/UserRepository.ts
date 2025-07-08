import { BaseRepository } from "../baseRepo";
import { IUserRepository } from "../interfaces/IUserRepository";
import { IUser } from "../../models/interfaces/IUser";
import { UserModel, IUserDoc } from "../../models/implements/UserModel";

export class UserRepository
  extends BaseRepository<IUserDoc>
  implements IUserRepository
{
  constructor() {
    super(UserModel);
  }

  async createUser(user: IUser): Promise<IUser> {
    return await this.create(user as IUserDoc); // ✅ type cast
  }
async findByEmail(email: string): Promise<IUserDoc | null> {
  return await super.findByEmail(email);
}

}
