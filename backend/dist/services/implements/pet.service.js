"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetService = void 0;
// src/services/pet.service.ts
const mongoose_1 = require("mongoose");
const pet_model_1 = require("../../models/implements/pet.model");
const petCategory_model_1 = require("../../models/implements/petCategory.model");
const uploadToCloudinary_1 = require("../../utils/uploadToCloudinary");
exports.PetService = {
    // Categories
    listCategories(activeOnly) {
        return __awaiter(this, void 0, void 0, function* () {
            const filter = activeOnly ? { isActive: true } : {};
            return petCategory_model_1.PetCategoryModel.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
        });
    },
    createCategory(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const name = (payload.name || "").trim();
            if (!name)
                throw new Error("name is required");
            // Pre-check for duplicate (case-insensitive) for friendly error
            const existing = yield petCategory_model_1.PetCategoryModel.findOne({ name })
                .collation({ locale: "en", strength: 2 })
                .lean();
            if (existing) {
                const err = new Error("Category name already exists (case-insensitive)");
                err.status = 409;
                throw err;
            }
            return petCategory_model_1.PetCategoryModel.create({
                name,
                iconKey: ((_a = payload.iconKey) === null || _a === void 0 ? void 0 : _a.trim()) || "",
                description: ((_b = payload.description) === null || _b === void 0 ? void 0 : _b.trim()) || "",
                isActive: (_c = payload.isActive) !== null && _c !== void 0 ? _c : true,
                sortOrder: Number.isFinite(payload.sortOrder)
                    ? Number(payload.sortOrder)
                    : 0,
            });
        });
    },
    updateCategory(id, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const cat = yield petCategory_model_1.PetCategoryModel.findById(id);
            if (!cat)
                return null;
            // If renaming, check for duplicates with collation
            if (typeof payload.name === "string") {
                const newName = payload.name.trim();
                if (!newName) {
                    const e = new Error("name is required");
                    e.status = 400;
                    throw e;
                }
                const dup = yield petCategory_model_1.PetCategoryModel.findOne({ name: newName })
                    .collation({ locale: "en", strength: 2 })
                    .lean();
                if (dup && String(dup._id) !== String(id)) {
                    const e = new Error("Category name already exists (case-insensitive)");
                    e.status = 409;
                    throw e;
                }
                cat.name = newName;
            }
            if (typeof payload.iconKey === "string")
                cat.iconKey = payload.iconKey.trim();
            if (typeof payload.description === "string")
                cat.description = payload.description.trim();
            if (typeof payload.isActive === "boolean")
                cat.isActive = payload.isActive;
            if (typeof payload.sortOrder === "number") {
                if (!Number.isInteger(payload.sortOrder) || payload.sortOrder < 0) {
                    const e = new Error("sortOrder must be a non-negative integer");
                    e.status = 400;
                    throw e;
                }
                cat.sortOrder = payload.sortOrder;
            }
            yield cat.save();
            return cat.toObject();
        });
    },
    listPetsByOwner(ownerId, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            const owner = new mongoose_1.Types.ObjectId(ownerId);
            const safePage = Math.max(1, Number(page) || 1);
            const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
            const skip = (safePage - 1) * safeLimit;
            // Pets that user currently owns (includes bought ones)
            const currentPets = yield pet_model_1.PetModel.find({
                currentOwnerId: owner,
                deletedAt: null,
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(safeLimit)
                .lean();
            // Pets user originally created (seller) but no longer owns
            const pastPets = yield pet_model_1.PetModel.find({
                userId: owner,
                currentOwnerId: { $ne: owner },
                deletedAt: null,
            })
                .sort({ updatedAt: -1 })
                .lean();
            const total = yield pet_model_1.PetModel.countDocuments({
                currentOwnerId: owner,
                deletedAt: null,
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
        });
    },
    getPetScoped(petId, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const pet = yield pet_model_1.PetModel.findById(petId).lean();
            if (!pet || pet.deletedAt)
                return null;
            const isOwner = String(pet.userId) === String(user._id);
            const isAdmin = (user === null || user === void 0 ? void 0 : user.role) === "admin";
            if (!isOwner && !isAdmin)
                return null;
            return pet;
        });
    },
    createPet(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const cat = yield petCategory_model_1.PetCategoryModel.findById(payload.speciesCategoryId).lean();
            if (!cat || !cat.isActive)
                throw new Error("Invalid or inactive category");
            const creatorId = payload.user._id;
            const doc = yield pet_model_1.PetModel.create({
                userId: creatorId,
                currentOwnerId: creatorId,
                name: payload.name,
                speciesCategoryId: cat._id,
                speciesCategoryName: cat.name,
                sex: (_a = payload.sex) !== null && _a !== void 0 ? _a : "unknown",
                birthDate: payload.birthDate ? new Date(payload.birthDate) : null,
                notes: (_b = payload.notes) !== null && _b !== void 0 ? _b : null,
                photoUrl: (_c = payload.photoUrl) !== null && _c !== void 0 ? _c : null,
                history: [
                    {
                        action: "created",
                        by: creatorId,
                        meta: null,
                    },
                ],
            });
            return doc.toObject();
        });
    },
    updatePetScoped(petId, user, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const pet = yield pet_model_1.PetModel.findById(petId);
            if (!pet || pet.deletedAt)
                return null;
            // Allow either the original creator OR the current owner
            const isOwner = String(pet.userId) === String(user._id) ||
                String(pet.currentOwnerId) === String(user._id);
            const isAdmin = (user === null || user === void 0 ? void 0 : user.role) === "admin";
            if (!isOwner && !isAdmin)
                return null;
            // Apply updates
            if (body.speciesCategoryId) {
                const cat = yield petCategory_model_1.PetCategoryModel.findById(body.speciesCategoryId).lean();
                if (!cat || !cat.isActive)
                    throw new Error("Invalid category");
                pet.speciesCategoryId = cat._id;
                pet.speciesCategoryName = cat.name;
            }
            if (typeof body.name === "string")
                pet.name = body.name;
            if (typeof body.sex === "string")
                pet.sex = body.sex;
            if (typeof body.birthDate === "string")
                pet.birthDate = new Date(body.birthDate);
            if (typeof body.notes === "string")
                pet.notes = body.notes;
            if (typeof body.photoUrl === "string")
                pet.photoUrl = body.photoUrl;
            yield pet.save();
            return pet.toObject();
        });
    },
    softDeletePetScoped(petId, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const pet = yield pet_model_1.PetModel.findById(petId);
            if (!pet || pet.deletedAt)
                return false;
            // Allow either original creator or current owner
            const isOwner = String(pet.userId) === String(user._id) ||
                String(pet.currentOwnerId) === String(user._id);
            const isAdmin = (user === null || user === void 0 ? void 0 : user.role) === "admin";
            if (!isOwner && !isAdmin)
                return false;
            pet.deletedAt = new Date();
            yield pet.save();
            return true;
        });
    },
    uploadPetPhotoFromBuffer(fileBuffer, filename) {
        return __awaiter(this, void 0, void 0, function* () {
            const safeName = (filename === null || filename === void 0 ? void 0 : filename.trim()) || `pet-${Date.now()}.jpg`;
            const result = yield (0, uploadToCloudinary_1.uploadPetImageBufferToCloudinary)(fileBuffer, safeName);
            return { url: result.secure_url, public_id: result.public_id };
        });
    },
    getPetHistory(petId, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const pet = yield pet_model_1.PetModel.findById(petId)
                .populate("userId", "name email profilePhoto")
                .populate("currentOwnerId", "name email profilePhoto")
                .populate("history.by", "name email profilePhoto")
                .lean();
            if (!pet || pet.deletedAt)
                return null;
            // Check permissions: owner, current owner, or admin
            const isOriginalOwner = String(pet.userId._id) === String(user._id);
            const isCurrentOwner = String(pet.currentOwnerId._id) === String(user._id);
            const isAdmin = (user === null || user === void 0 ? void 0 : user.role) === "admin";
            if (!isOriginalOwner && !isCurrentOwner && !isAdmin) {
                return null;
            }
            return pet;
        });
    },
};
