// src/services/pet.service.ts
import { Types } from 'mongoose';
import { PetModel } from '../../models/implements/pet.model';
import { PetCategoryModel } from '../../models/implements/petCategory.model';
import { uploadPetImageBufferToCloudinary } from '../../utils/uploadToCloudinary';

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
    const name = (payload.name || '').trim();
    if (!name) throw new Error('name is required');

    // Pre-check for duplicate (case-insensitive) for friendly error
    const existing = await PetCategoryModel.findOne({ name })
      .collation({ locale: 'en', strength: 2 })
      .lean();
    if (existing) {
      const err: any = new Error('Category name already exists (case-insensitive)');
      err.status = 409;
      throw err;
    }

    return PetCategoryModel.create({
      name,
      iconKey: payload.iconKey?.trim() || '',
      description: payload.description?.trim() || '',
      isActive: payload.isActive ?? true,
      sortOrder: Number.isFinite(payload.sortOrder) ? Number(payload.sortOrder) : 0,
    });
  },

  async updateCategory(id: string, payload: any): Promise<PetCategory | null> {
    const cat = await PetCategoryModel.findById(id);
    if (!cat) return null;

    // If renaming, check for duplicates with collation
    if (typeof payload.name === 'string') {
      const newName = payload.name.trim();
      if (!newName) {
        const e: any = new Error('name is required');
        e.status = 400;
        throw e;
      }
      const dup = await PetCategoryModel.findOne({ name: newName })
        .collation({ locale: 'en', strength: 2 })
        .lean();
      if (dup && String((dup as any)._id) !== String(id)) {
        const e: any = new Error('Category name already exists (case-insensitive)');
        e.status = 409;
        throw e;
      }
      cat.name = newName;
    }

    if (typeof payload.iconKey === 'string') cat.iconKey = payload.iconKey.trim();
    if (typeof payload.description === 'string') cat.description = payload.description.trim();
    if (typeof payload.isActive === 'boolean') cat.isActive = payload.isActive;
    if (typeof payload.sortOrder === 'number') {
      if (!Number.isInteger(payload.sortOrder) || payload.sortOrder < 0) {
        const e: any = new Error('sortOrder must be a non-negative integer');
        e.status = 400;
        throw e;
      }
      cat.sortOrder = payload.sortOrder;
    }
    await cat.save();
    return cat.toObject();
  },

async listPetsByOwner(ownerId: string, page: number, limit: number): Promise<any> {
  const owner = new Types.ObjectId(ownerId);
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
  const skip = (safePage - 1) * safeLimit;

  // Pets that user currently owns (includes bought ones)
  const currentPets = await PetModel.find({
    currentOwnerId: owner,
    deletedAt: null as any,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(safeLimit)
    .lean();

  // Pets user originally created (seller) but no longer owns
  const pastPets = await PetModel.find({
    userId: owner,
    currentOwnerId: { $ne: owner },
    deletedAt: null as any,
  })
    .sort({ updatedAt: -1 })
    .lean();

  const total = await PetModel.countDocuments({
    currentOwnerId: owner,
    deletedAt: null as any,
  });

  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  // Buyer: will just see "data". Seller: can also view "past"
  return {
    data: currentPets,
    past: pastPets,
    total,
    page: safePage,
    totalPages,
  };
}
,

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

  const creatorId = payload.user._id;

  const doc = await PetModel.create({
    userId: creatorId,
    currentOwnerId: creatorId,
    name: payload.name,
    speciesCategoryId: cat._id,
    speciesCategoryName: cat.name,
    sex: payload.sex ?? 'unknown',
    birthDate: payload.birthDate ? new Date(payload.birthDate) : null,
    notes: payload.notes ?? null,
    photoUrl: payload.photoUrl ?? null,
    history: [
      {
        action: "created",
        by: creatorId,
        meta: null,
      },
    ],
  });
  return doc.toObject();
},

async updatePetScoped(petId: string, user: any, body: any): Promise<Pet | null> {
  const pet = await PetModel.findById(petId);
  if (!pet || pet.deletedAt) return null;

  // Allow either the original creator OR the current owner
  const isOwner =
    String(pet.userId) === String(user._id) ||
    String(pet.currentOwnerId) === String(user._id);
  const isAdmin = user?.role === 'admin';

  if (!isOwner && !isAdmin) return null;

  // Apply updates
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

  // Allow either original creator or current owner
  const isOwner =
    String(pet.userId) === String(user._id) ||
    String(pet.currentOwnerId) === String(user._id);
  const isAdmin = user?.role === 'admin';

  if (!isOwner && !isAdmin) return false;

  pet.deletedAt = new Date();
  await pet.save();
  return true;
}
,

  async uploadPetPhotoFromBuffer(
    fileBuffer: Buffer,
    filename: string
  ): Promise<{ url: string; public_id: string }> {
    const safeName = filename?.trim() || `pet-${Date.now()}.jpg`;
    const result = await uploadPetImageBufferToCloudinary(fileBuffer, safeName);
    return { url: result.secure_url, public_id: result.public_id };
  },
  async getPetHistory(petId: string, user: any): Promise<Pet | null> {
  const pet = await PetModel.findById(petId)
    .populate('userId', 'name email profilePhoto')
    .populate('currentOwnerId', 'name email profilePhoto')
    .populate('history.by', 'name email profilePhoto')
    .lean();
  
  if (!pet || pet.deletedAt) return null;
  
  // Check permissions: owner, current owner, or admin
  const isOriginalOwner = String(pet.userId._id) === String(user._id);
  const isCurrentOwner = String(pet.currentOwnerId._id) === String(user._id);
  const isAdmin = user?.role === 'admin';
  
  if (!isOriginalOwner && !isCurrentOwner && !isAdmin) {
    return null;
  }
  
  return pet;
}
};
