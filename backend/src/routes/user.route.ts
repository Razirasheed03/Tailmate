// src/routes/user.routes.ts
import { Router } from 'express';
import { authJwt } from '../middlewares/authJwt';
import { 
  getVetDetail, 
  getVetSlots, 
  listDoctors, 
  updateMyProfile,
  listMyBookings,      // ADD THIS IMPORT
  getMyBooking,        // ADD THIS IMPORT
  cancelMyBooking,      // ADD THIS IMPORT
  getMyWallet,
  getMyWalletTransactions
} from '../controllers/Implements/user.controller';

const router = Router();

router.use(authJwt);

// User profile
router.put('/user/update', updateMyProfile);

// Vets/Doctors
router.get("/vets", listDoctors); 
router.get('/vets/:id', getVetDetail);
router.get('/vets/:id/slots', getVetSlots);

// ADD THESE BOOKING ROUTES:
router.get('/bookings', listMyBookings);
router.get('/bookings/:id', getMyBooking);
router.post('/bookings/:id/cancel', cancelMyBooking);

// user.routes.ts
router.get('/wallet', getMyWallet);
router.get('/wallet/transactions', getMyWalletTransactions); 

export default router;