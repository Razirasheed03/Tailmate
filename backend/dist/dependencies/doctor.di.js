"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doctorController = void 0;
const doctor_controller_1 = require("../controllers/Implements/doctor.controller");
const doctor_service_1 = require("../services/implements/doctor.service");
const payout_service_1 = require("../services/implements/payout.service");
const user_repository_1 = require("../repositories/implements/user.repository");
const doctor_repository_1 = require("../repositories/implements/doctor.repository");
exports.doctorController = new doctor_controller_1.DoctorController(new doctor_service_1.DoctorService(new user_repository_1.UserRepository(), new doctor_repository_1.DoctorRepository()), new payout_service_1.PayoutService());
