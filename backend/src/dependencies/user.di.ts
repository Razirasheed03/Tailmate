import { UserController } from "../controllers/Implements/user.controller";
import { UserService } from "../services/implements/user.service";
import { UserRepository } from "../repositories/implements/user.repository";
import { DoctorPublicRepository } from "../repositories/implements/doctorPublic.repository";
import { BookingRepository } from "../repositories/implements/booking.repository";

export const userController = new UserController(
  new UserService(
    new UserRepository(),
    new DoctorPublicRepository(),
    new BookingRepository()
  )
);
