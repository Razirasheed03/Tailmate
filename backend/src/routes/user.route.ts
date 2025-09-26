// src/routes/user.routes.ts
import { Router } from 'express';
import { authJwt } from '../middlewares/authJwt';
import { getVetDetail, getVetSlots, listDoctors, updateMyProfile } from '../controllers/Implements/user.controller';

const router = Router();

router.use(authJwt);
router.put('/user/update', updateMyProfile);
router.get("/vets", listDoctors); 
router.get('/vets/:id', getVetDetail);
router.get('/vets/:id/slots', getVetSlots);
export default router;
