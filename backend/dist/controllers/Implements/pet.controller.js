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
exports.PetController = void 0;
const pet_service_1 = require("../../services/implements/pet.service");
const httpStatus_1 = require("../../constants/httpStatus");
const ResponseHelper_1 = require("../../http/ResponseHelper");
const messageConstant_1 = require("../../constants/messageConstant");
exports.PetController = {
    listCategories(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const active = req.query.active === "true";
            const cats = yield pet_service_1.PetService.listCategories(active);
            return ResponseHelper_1.ResponseHelper.ok(res, cats, messageConstant_1.HttpResponse.RESOURCE_FOUND);
        });
    },
    createCategory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cat = yield pet_service_1.PetService.createCategory(req.body || {});
                return ResponseHelper_1.ResponseHelper.created(res, cat, messageConstant_1.HttpResponse.RESOURCE_FOUND);
            }
            catch (err) {
                const e = err;
                if ((e === null || e === void 0 ? void 0 : e.status) === 409 ||
                    (e === null || e === void 0 ? void 0 : e.code) === 11000 ||
                    String((e === null || e === void 0 ? void 0 : e.message) || "").includes("duplicate key")) {
                    return ResponseHelper_1.ResponseHelper.conflict(res, "Category name already exists (case-insensitive)");
                }
                return ResponseHelper_1.ResponseHelper.badRequest(res, (e === null || e === void 0 ? void 0 : e.message) || "Create failed");
            }
        });
    },
    updateCategory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cat = yield pet_service_1.PetService.updateCategory(req.params.id, req.body || {});
                if (!cat)
                    return ResponseHelper_1.ResponseHelper.notFound(res, messageConstant_1.HttpResponse.PAGE_NOT_FOUND);
                return ResponseHelper_1.ResponseHelper.ok(res, cat, messageConstant_1.HttpResponse.RESOURCE_UPDATED);
            }
            catch (err) {
                const e = err;
                if ((e === null || e === void 0 ? void 0 : e.status) === 409 ||
                    (e === null || e === void 0 ? void 0 : e.code) === 11000 ||
                    String((e === null || e === void 0 ? void 0 : e.message) || "").includes("duplicate key")) {
                    return ResponseHelper_1.ResponseHelper.conflict(res, "Category name already exists (case-insensitive)");
                }
                return ResponseHelper_1.ResponseHelper.badRequest(res, (e === null || e === void 0 ? void 0 : e.message) || "Update failed");
            }
        });
    },
    listPets(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const owner = req.query.owner || "me";
            const page = Math.max(1, parseInt(req.query.page || "1", 10));
            const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "10", 10)));
            const isAdmin = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === "admin";
            const userId = owner === "me" || !isAdmin ? req.user._id : owner;
            const result = yield pet_service_1.PetService.listPetsByOwner(userId, page, limit);
            return res.status(httpStatus_1.HttpStatus.OK).json(result);
        });
    },
    getPet(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const pet = yield pet_service_1.PetService.getPetScoped(req.params.id, req.user);
            if (!pet)
                return res.status(httpStatus_1.HttpStatus.NOT_FOUND).json({ message: "Not found" });
            return res.status(httpStatus_1.HttpStatus.OK).json(pet);
        });
    },
    createPet(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const b = req.body || {};
            if (!b.name || !b.speciesCategoryId) {
                return res
                    .status(httpStatus_1.HttpStatus.BAD_REQUEST)
                    .json({ message: "name and speciesCategoryId are required" });
            }
            try {
                const pet = yield pet_service_1.PetService.createPet({
                    user: req.user,
                    name: b.name,
                    speciesCategoryId: b.speciesCategoryId,
                    sex: b.sex,
                    birthDate: b.birthDate,
                    notes: b.notes,
                    photoUrl: b.photoUrl,
                });
                return res.status(httpStatus_1.HttpStatus.CREATED).json(pet);
            }
            catch (err) {
                const e = err;
                return res
                    .status(httpStatus_1.HttpStatus.BAD_REQUEST)
                    .json({ message: (e === null || e === void 0 ? void 0 : e.message) || "Create failed" });
            }
        });
    },
    updatePet(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pet = yield pet_service_1.PetService.updatePetScoped(req.params.id, req.user, req.body || {});
                if (!pet)
                    return res.status(httpStatus_1.HttpStatus.NOT_FOUND).json({ message: "Not found" });
                return res.status(httpStatus_1.HttpStatus.OK).json(pet);
            }
            catch (err) {
                const e = err;
                return res
                    .status(httpStatus_1.HttpStatus.BAD_REQUEST)
                    .json({ message: (e === null || e === void 0 ? void 0 : e.message) || "Update failed" });
            }
        });
    },
    deletePet(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const ok = yield pet_service_1.PetService.softDeletePetScoped(req.params.id, req.user);
            if (!ok)
                return res.status(httpStatus_1.HttpStatus.NOT_FOUND).json({ message: "Not found" });
            return res.status(httpStatus_1.HttpStatus.NO_CONTENT).send();
        });
    },
    uploadPetPhoto(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const directUrl = req.fileUrl || ((_a = req.upload) === null || _a === void 0 ? void 0 : _a.secure_url);
                if (typeof directUrl === "string" && directUrl) {
                    return res.status(httpStatus_1.HttpStatus.OK).json({ url: directUrl });
                }
                const file = req.file; // provided by upload/multer
                if (!(file === null || file === void 0 ? void 0 : file.buffer))
                    return res
                        .status(httpStatus_1.HttpStatus.BAD_REQUEST)
                        .json({ message: "file is required" });
                const { url } = yield pet_service_1.PetService.uploadPetPhotoFromBuffer(file.buffer, file.originalname || "pet.jpg");
                return res.status(httpStatus_1.HttpStatus.OK).json({ url });
            }
            catch (err) {
                const e = err;
                return res
                    .status(httpStatus_1.HttpStatus.BAD_REQUEST)
                    .json({ message: (e === null || e === void 0 ? void 0 : e.message) || "Upload failed" });
            }
        });
    },
    getPetHistory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pet = yield pet_service_1.PetService.getPetHistory(req.params.id, req.user);
                if (!pet) {
                    return ResponseHelper_1.ResponseHelper.notFound(res, "Pet not found or you don't have permission to view its history");
                }
                return ResponseHelper_1.ResponseHelper.ok(res, pet, "Pet history retrieved successfully");
            }
            catch (err) {
                const e = err;
                return ResponseHelper_1.ResponseHelper.badRequest(res, (e === null || e === void 0 ? void 0 : e.message) || "Failed to retrieve pet history");
            }
        });
    },
};
