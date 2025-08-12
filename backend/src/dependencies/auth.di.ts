import { AuthController } from "../controllers/auth/AuthController";
import { UserRepository } from "../repositories/implements/UserRepository";
import { AuthService } from "../services/implements/AuthService";

export const authController = new AuthController(new AuthService(new UserRepository()))


// // 1) Low-level dependency
// const userRepository = new UserRepository();

// // 2) Service depends on repository
// const authService = new AuthService(userRepository);

// // 3) Controller depends on service
// export const authController = new AuthController(authService);