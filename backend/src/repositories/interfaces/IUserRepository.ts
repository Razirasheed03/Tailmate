import { IUser } from "../../models/interfaces/IUser";

export interface IUserRepository{
    createUser(user:IUser):Promise<IUser>;
    findByEmail(email:string):Promise<IUser|null>
}
