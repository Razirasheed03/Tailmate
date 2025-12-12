"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pet_controller_1 = require("../controllers/Implements/pet.controller");
const authJwt_1 = require("../middlewares/authJwt");
const requireRoles_1 = require("../middlewares/requireRoles");
const roles_1 = require("../constants/roles");
const upload_1 = require("../middlewares/upload");
const router = (0, express_1.Router)();
// Pet categories only ADMIN can create/update
router.get('/pet-categories', pet_controller_1.PetController.listCategories);
router.post('/pet-categories', authJwt_1.authJwt, (0, requireRoles_1.requireRole)([roles_1.UserRole.ADMIN]), pet_controller_1.PetController.createCategory);
router.patch('/pet-categories/:id', authJwt_1.authJwt, (0, requireRoles_1.requireRole)([roles_1.UserRole.ADMIN]), pet_controller_1.PetController.updateCategory);
// Pets routes require authentication
router.use('/pets', authJwt_1.authJwt);
router.get('/pets', pet_controller_1.PetController.listPets);
router.get('/pets/:id/history', pet_controller_1.PetController.getPetHistory);
router.get('/pets/:id', pet_controller_1.PetController.getPet);
router.post('/pets', pet_controller_1.PetController.createPet);
router.patch('/pets/:id', pet_controller_1.PetController.updatePet); // Update
router.delete('/pets/:id', pet_controller_1.PetController.deletePet); // Delete
// Upload pet photo
router.post('/pet-uploads/photo', authJwt_1.authJwt, upload_1.uploadImage, pet_controller_1.PetController.uploadPetPhoto);
exports.default = router;
