import { Model } from "mongoose";
import { PetCategory } from "../../schema/petCategory.schema";
import { IPetCategoryModel } from "../interfaces/petCategory.model.interface";

export const PetCategoryModel: Model<IPetCategoryModel> = PetCategory;
