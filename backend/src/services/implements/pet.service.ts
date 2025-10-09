// src/services/pet.service.ts
import { Types } from 'mongoose';
import { PetModel } from '../../models/implements/pet.model';
import { PetCategoryModel } from '../../models/implements/petCategory.model';
import { uploadPetImageBufferToCloudinary } from '../../utils/uploadToCloudinary'; // expects (buffer|base64, options) -> { secure_url }

export type PetSex = 'male' | 'female' | 'unknown';

export type PetCategory = any;
export type Pet = any;

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
};

export const PetService = {
  // Categories
  async listCategories(activeOnly: boolean): Promise<PetCategory[]> {
    const filter = activeOnly ? { isActive: true } : {};
    return PetCategoryModel.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
  },

  async createCategory(payload: {
    name: string;
    iconKey?: string;
    description?: string;
    isActive?: boolean;
    sortOrder?: number;
  }): Promise<PetCategory> {
    if (!payload.name) throw new Error('name is required');
    return PetCategoryModel.create({
      name: payload.name,
      iconKey: payload.iconKey,
      description: payload.description,
      isActive: payload.isActive ?? true,
      sortOrder: payload.sortOrder ?? 0,
    });
  },

  async updateCategory(id: string, payload: any): Promise<PetCategory | null> {
    const cat = await PetCategoryModel.findById(id);
    if (!cat) return null;
    if (typeof payload.name === 'string') cat.name = payload.name;
    if (typeof payload.iconKey === 'string') cat.iconKey = payload.iconKey;
    if (typeof payload.description === 'string') cat.description = payload.description;
    if (typeof payload.isActive === 'boolean') cat.isActive = payload.isActive;
    if (typeof payload.sortOrder === 'number') cat.sortOrder = payload.sortOrder;
    await cat.save();
    return cat.toObject();
  },

  // Pets
  async listPetsByOwner(ownerId: string, page: number, limit: number): Promise<Paginated<Pet>> {
    const owner = new Types.ObjectId(ownerId);
    const filter = { userId: owner, deletedAt: null as any };
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
    const skip = (safePage - 1) * safeLimit;

    const [data, total] = await Promise.all([
      PetModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
      PetModel.countDocuments(filter),
    ]);

    return { data, total, page: safePage, totalPages: Math.max(1, Math.ceil(total / safeLimit)) };
  },

  async getPetScoped(petId: string, user: any): Promise<Pet | null> {
    const pet = await PetModel.findById(petId).lean();
    if (!pet || pet.deletedAt) return null;
    const isOwner = String(pet.userId) === String(user._id);
    const isAdmin = user?.role === 'admin';
    if (!isOwner && !isAdmin) return null;
    return pet;
  },

  async createPet(payload: {
    user: any;
    name: string;
    speciesCategoryId: string;
    sex?: PetSex;
    birthDate?: string;
    notes?: string;
    photoUrl?: string;
  }): Promise<Pet> {
    const cat = await PetCategoryModel.findById(payload.speciesCategoryId).lean();
    if (!cat || !cat.isActive) throw new Error('Invalid or inactive category');

    const doc = await PetModel.create({
      userId: payload.user._id,
      name: payload.name,
      speciesCategoryId: cat._id,
      speciesCategoryName: cat.name,
      sex: payload.sex ?? 'unknown',
      birthDate: payload.birthDate ? new Date(payload.birthDate) : null,
      notes: payload.notes ?? null,
      photoUrl: payload.photoUrl ?? null,
    });
    return doc.toObject();
  },

  async updatePetScoped(petId: string, user: any, body: any): Promise<Pet | null> {
    const pet = await PetModel.findById(petId);
    if (!pet || pet.deletedAt) return null;
    const isOwner = String(pet.userId) === String(user._id);
    const isAdmin = user?.role === 'admin';
    if (!isOwner && !isAdmin) return null;

    if (body.speciesCategoryId) {
      const cat = await PetCategoryModel.findById(body.speciesCategoryId).lean();
      if (!cat || !cat.isActive) throw new Error('Invalid category');
      pet.speciesCategoryId = cat._id as any;
      pet.speciesCategoryName = cat.name;
    }
    if (typeof body.name === 'string') pet.name = body.name;
    if (typeof body.sex === 'string') pet.sex = body.sex;
    if (typeof body.birthDate === 'string') pet.birthDate = new Date(body.birthDate);
    if (typeof body.notes === 'string') pet.notes = body.notes;
    if (typeof body.photoUrl === 'string') pet.photoUrl = body.photoUrl;

    await pet.save();
    return pet.toObject();
  },

  async softDeletePetScoped(petId: string, user: any): Promise<boolean> {
    const pet = await PetModel.findById(petId);
    if (!pet || pet.deletedAt) return false;
    const isOwner = String(pet.userId) === String(user._id);
    const isAdmin = user?.role === 'admin';
    if (!isOwner && !isAdmin) return false;

    pet.deletedAt = new Date();
    await pet.save();
    return true;
  },

  async uploadPetPhotoFromBuffer(
    fileBuffer: Buffer,
    filename: string
  ): Promise<{ url: string; public_id: string }> {
    const safeName = filename?.trim() || `pet-${Date.now()}.jpg`;
    const result = await uploadPetImageBufferToCloudinary(fileBuffer, safeName);
    return { url: result.secure_url, public_id: result.public_id };
  },
};
