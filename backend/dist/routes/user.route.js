"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/user.routes.ts
const express_1 = require("express");
const authJwt_1 = require("../middlewares/authJwt");
const asyncHandler_1 = require("../utils/asyncHandler");
const user_di_1 = require("../dependencies/user.di");
const router = (0, express_1.Router)();
const c = user_di_1.userController;
router.use(authJwt_1.authJwt);
// User profile
router.put('/user/update', (0, asyncHandler_1.asyncHandler)((req, res, next) => c.updateMyProfile(req, res, next)));
// Vets/Doctors
router.get("/vets", (0, asyncHandler_1.asyncHandler)((req, res, next) => c.listDoctors(req, res, next)));
router.get('/vets/:id', (0, asyncHandler_1.asyncHandler)((req, res, next) => c.getVetDetail(req, res, next)));
router.get('/vets/:id/slots', (0, asyncHandler_1.asyncHandler)((req, res, next) => c.getVetSlots(req, res, next)));
// Booking routes
router.get('/bookings', (0, asyncHandler_1.asyncHandler)((req, res, next) => c.listMyBookings(req, res, next)));
router.get('/bookings/:id', (0, asyncHandler_1.asyncHandler)((req, res, next) => c.getMyBooking(req, res, next)));
router.post('/bookings/:id/cancel', (0, asyncHandler_1.asyncHandler)((req, res, next) => c.cancelMyBooking(req, res, next)));
// Wallet routes
router.get('/wallet', (0, asyncHandler_1.asyncHandler)((req, res, next) => c.getMyWallet(req, res, next)));
router.get('/wallet/transactions', (0, asyncHandler_1.asyncHandler)((req, res, next) => c.getMyWalletTransactions(req, res, next)));
exports.default = router;
