//dependencies/consultation.di.ts
import { ConsultationController } from "../controllers/Implements/consultation.controller";
import { ConsultationService } from "../services/implements/consultation.service";
import { ConsultationRepository } from "../repositories/implements/consultation.repository";
import { BookingRepository } from "../repositories/implements/booking.repository";

export const consultationController = new ConsultationController(
  new ConsultationService(
    new ConsultationRepository(),
    new BookingRepository()
  )
);
