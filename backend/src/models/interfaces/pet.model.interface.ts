// backend/src/models/interfaces/pet.model.interface.ts
import { Document, Types } from "mongoose";

export type PetSex = "male" | "female" | "unknown";

export interface IPetHistoryEvent {
  at: Date;
  action: string;
  by: Types.ObjectId;
  meta?: any;
}

export interface IPetModel extends Document {
  userId: Types.ObjectId;
  currentOwnerId: Types.ObjectId;
  name: string;
  speciesCategoryId: Types.ObjectId;
  speciesCategoryName: string;
  breedId?: Types.ObjectId | null;
  breedName?: string | null;
  sex?: PetSex;
  birthDate?: Date | null;
  ageDisplay?: string | null;
  notes?: string | null;
  photoUrl?: string | null;
  deletedAt?: Date | null;
  history?: IPetHistoryEvent[];
  createdAt?: Date;
  updatedAt?: Date;
}
