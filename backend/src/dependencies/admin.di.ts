import { AdminController } from "../controllers/Admin/AdminController";
import { AdminService } from "../services/implements/AdminService";
import { UserRepository } from "../repositories/implements/UserRepository";

export const adminController=new AdminController(new AdminService(new UserRepository()))