// src/routes/pet.routes.ts
import { Router } from 'express';
import { PetController } from '../controllers/Implements/pet.controller';
import { authJwt } from '../middlewares/authJwt';
import { requireRole } from '../middlewares/requireRoles';
import { UserRole } from '../constants/roles';
import { uploadImage } from '../middlewares/upload'; // your existing Cloudinary multer wrapper

const router = Router();

// Categories
router.get('/pet-categories', PetController.listCategories);
router.post(
  '/pet-categories',
  authJwt,
  requireRole([UserRole.ADMIN]),
  PetController.createCategory
);
router.patch(
  '/pet-categories/:id',
  authJwt,
  requireRole([UserRole.ADMIN]),
  PetController.updateCategory
);

// Pets (auth required)
router.use('/pets', authJwt);
router.get('/pets', PetController.listPets);                // ?owner=me|<userId>&page&limit
router.get('/pets/:id', PetController.getPet);
router.post('/pets', PetController.createPet);
router.patch('/pets/:id', PetController.updatePet);
router.delete('/pets/:id', PetController.deletePet);

// Uploads (use existing Cloudinary middleware)
router.post(
  '/pet-uploads/photo',
  authJwt,
  uploadImage,                      // expects field 'file' or as configured in your middleware
  PetController.uploadPetPhoto
);

export default router;
