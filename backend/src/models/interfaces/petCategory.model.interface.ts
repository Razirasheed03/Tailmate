import { Document } from "mongoose";

export interface IPetCategoryModel extends Document {
  name: string;          // e.g., Dog, Cat
  iconKey?: string;      // frontend mapping (optional)
  description?: string;  // optional help text
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}
