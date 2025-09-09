//schema/petCategory.schema.ts
import { Schema, model } from "mongoose";
import { IPetCategoryModel } from "../models/interfaces/petCategory.model.interface";

const PetCategorySchema = new Schema<IPetCategoryModel>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    iconKey: { type: String },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PetCategorySchema.index({ isActive: 1, sortOrder: 1 });

export const PetCategory = model<IPetCategoryModel>("PetCategory", PetCategorySchema);
