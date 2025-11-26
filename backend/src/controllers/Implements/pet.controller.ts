// src/controllers/Implements/pet.controller.ts
import { Request, Response } from "express";
import { PetService } from "../../services/implements/pet.service";
import { HttpStatus } from "../../constants/httpStatus";
import { ResponseHelper } from "../../http/ResponseHelper";
import { HttpResponse } from "../../constants/messageConstant";

export const PetController = {
  async listCategories(req: Request, res: Response) {
    const active = req.query.active === "true";
    const cats = await PetService.listCategories(active);
    return ResponseHelper.ok(res, cats, HttpResponse.RESOURCE_FOUND);
  },
  async createCategory(req: Request, res: Response) {
    try {
      const cat = await PetService.createCategory(req.body || {});
      return ResponseHelper.created(res, cat, HttpResponse.RESOURCE_FOUND);
    } catch (err:unknown) {
      const e=err as {status:number,code:number,message:string}
      if (
        e?.status === 409 ||
        e?.code === 11000 ||
        String(e?.message || "").includes("duplicate key")
      ) {
        return ResponseHelper.conflict(
          res,
          "Category name already exists (case-insensitive)"
        );
      }
      return ResponseHelper.badRequest(res, e?.message || "Create failed");
    }
  },

  async updateCategory(req: Request, res: Response) {
    try {
      const cat = await PetService.updateCategory(
        req.params.id,
        req.body || {}
      );
      if (!cat)
        return ResponseHelper.notFound(res, HttpResponse.PAGE_NOT_FOUND);
      return ResponseHelper.ok(res, cat, HttpResponse.RESOURCE_UPDATED);
    } catch (err: unknown) {
            const e=err as {status:number,code:number,message:string}
      if (
        e?.status === 409 ||
        e?.code === 11000 ||
        String(e?.message || "").includes("duplicate key")
      ) {
        return ResponseHelper.conflict(
          res,
          "Category name already exists (case-insensitive)"
        );
      }
      return ResponseHelper.badRequest(res, e?.message || "Update failed");
    }
  },

  async listPets(req: Request, res: Response) {
    const owner = (req.query.owner as string) || "me";
    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt((req.query.limit as string) || "10", 10))
    );
    const isAdmin = (req as any).user?.role === "admin";
    const userId = owner === "me" || !isAdmin ? (req as any).user._id : owner;
    const result = await PetService.listPetsByOwner(userId, page, limit);
    return res.status(HttpStatus.OK).json(result);
  },

  async getPet(req: Request, res: Response) {
    const pet = await PetService.getPetScoped(req.params.id, (req as any).user);
    if (!pet)
      return res.status(HttpStatus.NOT_FOUND).json({ message: "Not found" });
    return res.status(HttpStatus.OK).json(pet);
  },

  async createPet(req: Request, res: Response) {
    const b = req.body || {};
    if (!b.name || !b.speciesCategoryId) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "name and speciesCategoryId are required" });
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
    } catch (err: unknown) {
      const e=err as {message:string}
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: e?.message || "Create failed" });
    }
  },
  async updatePet(req: Request, res: Response) {
    try {
      const pet = await PetService.updatePetScoped(
        req.params.id,
        (req as any).user,
        req.body || {}
      );
      if (!pet)
        return res.status(HttpStatus.NOT_FOUND).json({ message: "Not found" });
      return res.status(HttpStatus.OK).json(pet);
    } catch (err: unknown) {
      const e=err as {message:string}
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: e?.message || "Update failed" });
    }
  },

  async deletePet(req: Request, res: Response) {
    const ok = await PetService.softDeletePetScoped(
      req.params.id,
      (req as any).user
    );
    if (!ok)
      return res.status(HttpStatus.NOT_FOUND).json({ message: "Not found" });
    return res.status(HttpStatus.NO_CONTENT).send();
  },

  async uploadPetPhoto(req: Request, res: Response) {
    try {
      const directUrl = (req as any).fileUrl || (req as any).upload?.secure_url;
      if (typeof directUrl === "string" && directUrl) {
        return res.status(HttpStatus.OK).json({ url: directUrl });
      }
      const file = (req as any).file; // provided by upload/multer
      if (!file?.buffer)
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: "file is required" });

      const { url } = await PetService.uploadPetPhotoFromBuffer(
        file.buffer,
        file.originalname || "pet.jpg"
      );
      return res.status(HttpStatus.OK).json({ url });
    } catch (err: unknown) {
      const e=err as {message:string}
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: e?.message || "Upload failed" });
    }
  },
  async getPetHistory(req: Request, res: Response) {
    try {
      const pet = await PetService.getPetHistory(
        req.params.id,
        (req as any).user
      );

      if (!pet) {
        return ResponseHelper.notFound(
          res,
          "Pet not found or you don't have permission to view its history"
        );
      }

      return ResponseHelper.ok(res, pet, "Pet history retrieved successfully");
    } catch (err: unknown) {
      const e=err as {message:string}
      return ResponseHelper.badRequest(
        res,
        e?.message || "Failed to retrieve pet history"
      );
    }
  },
};
