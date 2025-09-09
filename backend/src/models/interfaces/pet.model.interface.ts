import { Document, Types } from "mongoose";

export type PetSex = "male" | "female" | "unknown";

export interface IPetModel extends Document {
  userId: Types.ObjectId;                // owner reference
  name: string;                          // display name
  speciesCategoryId: Types.ObjectId;     // ref: PetCategory
  speciesCategoryName: string;           // denormalized for fast lists
  breedId?: Types.ObjectId | null;       // optional ref: PetBreed
  breedName?: string | null;             // denormalized
  sex?: PetSex;
  birthDate?: Date | null;
  ageDisplay?: string | null;            // precomputed age text (optional)
  notes?: string | null;
  photoUrl?: string | null;              // public URL to photo (S3 etc.)
  deletedAt?: Date | null;               // soft delete
  createdAt?: Date;                      // timestamps
  updatedAt?: Date;
}
