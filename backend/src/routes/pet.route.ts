import { Router } from 'express';
import { PetController } from '../controllers/Implements/pet.controller';
import { authJwt } from '../middlewares/authJwt';
import { requireRole } from '../middlewares/requireRoles';
import { UserRole } from '../constants/roles';
import { uploadImage } from '../middlewares/upload';

const router = Router();

// Pet categories only ADMIN can create/update
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

// Pets routes require authentication
router.use('/pets', authJwt);

router.get('/pets', PetController.listPets);
router.get('/pets/:id/history', PetController.getPetHistory);
router.get('/pets/:id', PetController.getPet);
router.post('/pets', PetController.createPet);
router.patch('/pets/:id', PetController.updatePet);  // Update
router.delete('/pets/:id', PetController.deletePet); // Delete


// Upload pet photo
router.post('/pet-uploads/photo', authJwt, uploadImage, PetController.uploadPetPhoto);
export default router;
