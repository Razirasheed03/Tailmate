import { AdminController } from "../controllers/Implements/admin.controller";
import { AdminService } from "../services/implements/admin.service";
import { UserRepository } from "../repositories/implements/user.repository";

export const adminController = new AdminController(
  new AdminService(new UserRepository())
);
