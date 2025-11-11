// src/dtos/admin/petCategory.dto.ts
export interface PetCategoryDTO {
  id: string;
  name: string;
  iconKey?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PetCategoryListResponseDTO {
  data: PetCategoryDTO[];
  page: number;
  totalPages: number;
  total: number;
}

export interface CreatePetCategoryDTO {
  name: string;
  iconKey?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdatePetCategoryDTO {
  name?: string;
  iconKey?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}
