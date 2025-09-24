// backend/src/dependencies/doctorAvailability.di.ts
import { DoctorAvailabilityController } from "../controllers/doctorAvailability.controller";
import { DoctorAvailabilityService } from "../services/doctorAvailability.service";
import { DoctorAvailabilityRepository } from "../repositories/doctorAvailability.repository";
import { userRepository } from "./user.di"; // assumed existing
import { doctorRepository } from "./doctor.di"; // assumed existing

const availabilityRepo = new DoctorAvailabilityRepository();
const availabilityService = new DoctorAvailabilityService(userRepository, doctorRepository, availabilityRepo);
export const doctorAvailabilityController = new DoctorAvailabilityController(availabilityService);
