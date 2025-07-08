import { IAuthService } from "../interfaces/IAuthService";
import { IUserRepository } from "../../repositories/interfaces/IUserRepository";
import { IUser } from "../../models/interfaces/IUser";
import bcrypt from "bcryptjs";

export class AuthService implements IAuthService {
  constructor(private _userRepo: IUserRepository) {}

   signup = async (user: IUser): Promise<IUser> =>{
    console.log('🔍 AuthService.signup called with:', { ...user, password: '[HIDDEN]' });
    
    try {
      // Check if user already exists
      const existing = await this._userRepo.findByEmail(user.email);
      if (existing) {
        console.log('❌ User already exists with email:', user.email);
        throw new Error("User already exists");
      }

      // Hash password
      console.log('🔍 Hashing password...');
      const hashedPassword = await bcrypt.hash(user.password, 10);
      console.log('✅ Password hashed successfully');

      // Create user
      const userToCreate = { ...user, password: hashedPassword };
      console.log('🔍 Creating user with hashed password...');
      
      const createdUser = await this._userRepo.createUser(userToCreate);
      console.log('✅ User created successfully:', { ...createdUser, password: '[HIDDEN]' });
      
      return createdUser;
    } catch (error) {
      console.error('❌ Error in AuthService.signup:', error);
      throw error;
    }
  }
}