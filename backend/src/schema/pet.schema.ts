// backend/src/schema/pet.schema.ts
import { Schema, model, Types } from "mongoose";
import { IPetModel } from "../models/interfaces/pet.model.interface";

const PetEventSchema = new Schema(
  {
    at: { type: Date, default: Date.now },
    action: { type: String, required: true },
    by: { type: Types.ObjectId, ref: "User", required: true },
    meta: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const PetSchema = new Schema<IPetModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    currentOwnerId: {
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
    history: { type: [PetEventSchema], default: [] },
  },
  { timestamps: true }
);

PetSchema.index({ userId: 1, createdAt: -1 });
PetSchema.index({ currentOwnerId: 1, createdAt: -1 });
PetSchema.index({ userId: 1, currentOwnerId: 1 });

export const Pet = model<IPetModel>("Pet", PetSchema);