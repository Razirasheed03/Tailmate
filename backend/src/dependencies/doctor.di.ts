import { DoctorController } from "../controllers/Implements/doctor.controller";
import { DoctorService } from "../services/implements/doctor.service";
import { PayoutService } from "../services/implements/payout.service";
import { UserRepository } from "../repositories/implements/user.repository";
import { DoctorRepository } from "../repositories/implements/doctor.repository";

export const doctorController = new DoctorController(
  new DoctorService(new UserRepository(), new DoctorRepository()),
  new PayoutService()
);
