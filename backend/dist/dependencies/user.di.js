"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const user_controller_1 = require("../controllers/Implements/user.controller");
const user_service_1 = require("../services/implements/user.service");
const user_repository_1 = require("../repositories/implements/user.repository");
const doctorPublic_repository_1 = require("../repositories/implements/doctorPublic.repository");
const booking_repository_1 = require("../repositories/implements/booking.repository");
exports.userController = new user_controller_1.UserController(new user_service_1.UserService(new user_repository_1.UserRepository(), new doctorPublic_repository_1.DoctorPublicRepository(), new booking_repository_1.BookingRepository()));
