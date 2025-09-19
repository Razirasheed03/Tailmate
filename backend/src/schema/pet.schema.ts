//schema/pet.schema.ts
import { Schema, model } from "mongoose";
import { IPetModel } from "../models/interfaces/pet.model.interface";

const PetSchema = new Schema<IPetModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    speciesCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "PetCategory",
      required: true,
    },
    speciesCategoryName: { type: String, required: true, trim: true },
    breedId: { type: Schema.Types.ObjectId, ref: "PetBreed", default: null },
    breedName: { type: String, default: null },
    sex: {
      type: String,
      enum: ["male", "female", "unknown"],
      default: "unknown",
    },
    birthDate: { type: Date, default: null },
    ageDisplay: { type: String, default: null },
    notes: { type: String, maxlength: 1000, default: null },
    photoUrl: { type: String, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound index optimizes owner lists and recent ordering
PetSchema.index({ userId: 1, createdAt: -1 });

// Optional text index for searching by name
// PetSchema.index({ name: "text" });

export const Pet = model<IPetModel>("Pet", PetSchema);
