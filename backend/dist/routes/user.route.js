"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/user.routes.ts
const express_1 = require("express");
const authJwt_1 = require("../middlewares/authJwt");
const user_controller_1 = require("../controllers/Implements/user.controller");
const router = (0, express_1.Router)();
router.use(authJwt_1.authJwt);
// User profile
router.put('/user/update', user_controller_1.updateMyProfile);
// Vets/Doctors
router.get("/vets", user_controller_1.listDoctors);
router.get('/vets/:id', user_controller_1.getVetDetail);
router.get('/vets/:id/slots', user_controller_1.getVetSlots);
// ADD THESE BOOKING ROUTES:
router.get('/bookings', user_controller_1.listMyBookings);
router.get('/bookings/:id', user_controller_1.getMyBooking);
router.post('/bookings/:id/cancel', user_controller_1.cancelMyBooking);
// user.routes.ts
router.get('/wallet', user_controller_1.getMyWallet);
router.get('/wallet/transactions', user_controller_1.getMyWalletTransactions);
exports.default = router;
