import { BaseRepository } from "../baseRepo";
import { IUserRepository } from "../interfaces/IUserRepository";
import { IUser } from "../../models/interfaces/IUser";
import { UserModel, IUserDoc } from "../../models/implements/UserModel";

export class UserRepository extends BaseRepository<IUserDoc> implements IUserRepository {
  constructor() {
    super(UserModel);
  }

  async createUser(user: IUser): Promise<IUserDoc> {
    return await super.create(user);
  }

  async findByEmail(email: string): Promise<IUserDoc | null> {
    return await this.model.findOne({ email });
  }
  async findById(id: string): Promise<IUserDoc|null> {
  return await this.model.findById(id);
}

}
