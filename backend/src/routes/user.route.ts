// src/routes/user.routes.ts
import { Router } from 'express';
import { authJwt } from '../middlewares/authJwt';
import { asyncHandler } from '../utils/asyncHandler';
import { userController } from '../dependencies/user.di';

const router = Router();
const c = userController;

router.use(authJwt);

// User profile
router.put('/user/update', asyncHandler((req, res, next) => c.updateMyProfile(req, res, next)));

// Vets/Doctors
router.get("/vets", asyncHandler((req, res, next) => c.listDoctors(req, res, next))); 
router.get('/vets/:id', asyncHandler((req, res, next) => c.getVetDetail(req, res, next)));
router.get('/vets/:id/slots', asyncHandler((req, res, next) => c.getVetSlots(req, res, next)));

// Booking routes
router.get('/bookings', asyncHandler((req, res, next) => c.listMyBookings(req, res, next)));
router.get('/bookings/:id', asyncHandler((req, res, next) => c.getMyBooking(req, res, next)));
router.post('/bookings/:id/cancel', asyncHandler((req, res, next) => c.cancelMyBooking(req, res, next)));

// Wallet routes
router.get('/wallet', asyncHandler((req, res, next) => c.getMyWallet(req, res, next)));
router.get('/wallet/transactions', asyncHandler((req, res, next) => c.getMyWalletTransactions(req, res, next))); 

export default router;