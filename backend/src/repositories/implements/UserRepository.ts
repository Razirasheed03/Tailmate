import { BaseRepository } from "../baseRepo";
import { IUserRepository } from "../interfaces/IUserRepository";
import { IUser } from "../../models/interfaces/IUser";
import { UserModel, IUserDoc } from "../../models/implements/UserModel";

export class UserRepository extends BaseRepository<IUserDoc> implements IUserRepository {
  constructor() {
    super(UserModel);
  }

  async createUser(user: IUser): Promise<IUserDoc> {
    // user: IUser (no _id) → Model.create returns IUserDoc (with _id)
    return await UserModel.create(user);
  }

  async findByEmail(email: string): Promise<IUserDoc | null> {
    return await UserModel.findOne({ email });
  }
}
