// src/controllers/Implements/pet.controller.ts
import { Request, Response } from 'express';
import { PetService } from '../../services/implements/pet.service';
import { HttpStatus } from '../../constants/httpStatus';

export const PetController = {
  async listCategories(req: Request, res: Response) {
    const active = req.query.active === 'true';
    const data = await PetService.listCategories(active);
    return res.json({ data });
  },

  async createCategory(req: Request, res: Response) {
    try {
      const cat = await PetService.createCategory(req.body || {});
      return res.status(HttpStatus.CREATED).json(cat);
    } catch (e: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: e.message || 'Create failed' });
    }
  },

  async updateCategory(req: Request, res: Response) {
    try {
      const cat = await PetService.updateCategory(req.params.id, req.body || {});
      if (!cat) return res.status(HttpStatus.NOT_FOUND).json({ message: 'Not found' });
      return res.json(cat);
    } catch (e: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: e.message || 'Update failed' });
    }
  },

  // Pets
  async listPets(req: Request, res: Response) {
    const owner = (req.query.owner as string) || 'me';
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '10', 10)));
    const isAdmin = (req as any).user?.role === 'admin';
    const userId = owner === 'me' || !isAdmin ? (req as any).user._id : owner;
    const result = await PetService.listPetsByOwner(userId, page, limit);
    return res.json(result);
  },

  async getPet(req: Request, res: Response) {
    const pet = await PetService.getPetScoped(req.params.id, (req as any).user);
    if (!pet) return res.status(HttpStatus.NOT_FOUND).json({ message: 'Not found' });
    return res.json(pet);
  },

  async createPet(req: Request, res: Response) {
    const b = req.body || {};
    if (!b.name || !b.speciesCategoryId) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: 'name and speciesCategoryId are required' });
    }
    try {
      const pet = await PetService.createPet({
        user: (req as any).user,
        name: b.name,
        speciesCategoryId: b.speciesCategoryId,
        sex: b.sex,
        birthDate: b.birthDate,
        notes: b.notes,
        photoUrl: b.photoUrl,
      });
      return res.status(HttpStatus.CREATED).json(pet);
    } catch (e: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: e.message || 'Create failed' });
    }
  },

  async updatePet(req: Request, res: Response) {
    try {
      const pet = await PetService.updatePetScoped(req.params.id, (req as any).user, req.body || {});
      if (!pet) return res.status(HttpStatus.NOT_FOUND).json({ message: 'Not found' });
      return res.json(pet);
    } catch (e: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: e.message || 'Update failed' });
    }
  },

  async deletePet(req: Request, res: Response) {
    const ok = await PetService.softDeletePetScoped(req.params.id, (req as any).user);
    if (!ok) return res.status(HttpStatus.NOT_FOUND).json({ message: 'Not found' });
    return res.status(HttpStatus.NO_CONTENT).send();
  },

  async uploadPetPhoto(req: Request, res: Response) {
  try {
    const directUrl = (req as any).fileUrl || (req as any).upload?.secure_url;
    if (typeof directUrl === 'string' && directUrl) {
      return res.json({ url: directUrl });
    }

    // Otherwise, if uploadImage just gives a buffer, upload via service:
    const file = (req as any).file; // provided by uploadImage/multer
    if (!file?.buffer) return res.status(HttpStatus.BAD_REQUEST).json({ message: 'file is required' });

    const { url } = await PetService.uploadPetPhotoFromBuffer(file.buffer, file.originalname || 'pet.jpg');
    return res.json({ url });
  } catch (e: any) {
    return res.status(HttpStatus.BAD_REQUEST).json({ message: e.message || 'Upload failed' });
  }
},
};
