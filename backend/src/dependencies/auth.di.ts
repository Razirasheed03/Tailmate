import { AuthController } from "../controllers/auth/AuthController";
import { UserRepository } from "../repositories/implements/UserRepository";
import { AuthService } from "../services/implements/AuthService";

export const authController = new AuthController(new AuthService(new UserRepository()))