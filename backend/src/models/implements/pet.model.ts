import { Model } from "mongoose";
import { Pet } from "../../schema/pet.schema";
import { IPetModel } from "../interfaces/pet.model.interface";

export const PetModel: Model<IPetModel> = Pet;
