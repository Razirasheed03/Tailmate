// src/routes/user.routes.ts
import { Router } from 'express';
import { authJwt } from '../middlewares/authJwt';
import { updateMyProfile } from '../controllers/Implements/user.controller';

const router = Router();

router.use(authJwt);
router.put('/user/update', updateMyProfile);

export default router;
