import { PetSex } from "../implements/pet.service";

export interface IPetService {
  listCategories(activeOnly: boolean): Promise<any[]>;

  createCategory(payload: {
    name: string;
    iconKey?: string;
    description?: string;
    isActive?: boolean;
    sortOrder?: number;
  }): Promise<any>;

  listPetsByOwner(
    ownerId: string,
    page: number,
    limit: number
  ): Promise<any>;

  getPetScoped(petId: string, user: unknown): Promise<any | null>;

  createPet(payload: {
    user: unknown;
    name: string;
    speciesCategoryId: string;
    sex?: PetSex;
    birthDate?: string;
    notes?: string;
    photoUrl?: string;
  }): Promise<any>;
}
