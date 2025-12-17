"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consultationController = void 0;
const consultation_controller_1 = require("../controllers/Implements/consultation.controller");
const consultation_service_1 = require("../services/implements/consultation.service");
const consultation_repository_1 = require("../repositories/implements/consultation.repository");
const booking_repository_1 = require("../repositories/implements/booking.repository");
exports.consultationController = new consultation_controller_1.ConsultationController(new consultation_service_1.ConsultationService(new consultation_repository_1.ConsultationRepository(), new booking_repository_1.BookingRepository()));
