// schema/petCategory.schema.ts
import { Schema, model } from "mongoose";
import { IPetCategoryModel } from "../models/interfaces/petCategory.model.interface";

const PetCategorySchema = new Schema<IPetCategoryModel>(
  {
    name: { type: String, required: true, trim: true },
    iconKey: { type: String, default: "" },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

PetCategorySchema.index(
  { name: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 },
  }
);

PetCategorySchema.index({ isActive: 1, sortOrder: 1 });

export const PetCategory = model<IPetCategoryModel>("PetCategory", PetCategorySchema);
