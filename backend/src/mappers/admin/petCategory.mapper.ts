// src/mappers/admin/petCategory.mapper.ts
import {
  PetCategoryDTO,
  PetCategoryListResponseDTO,
  CreatePetCategoryDTO,
  UpdatePetCategoryDTO,
} from "../../dtos/admin/petCategory.dto";

export class PetCategoryMapper {
  static toPetCategoryDTO(category: any): PetCategoryDTO {
    return {
      id: category._id?.toString() || "",
      name: category.name || "",
      iconKey: category.iconKey,
      description: category.description,
      isActive: category.isActive ?? true,
      sortOrder: category.sortOrder ?? 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  static toPetCategoryListResponseDTO(
    data: any[],
    page: number,
    totalPages: number,
    total: number
  ): PetCategoryListResponseDTO {
    return {
      data: data.map((cat) => this.toPetCategoryDTO(cat)),
      page,
      totalPages,
      total,
    };
  }

  static toCreatePayload(dto: CreatePetCategoryDTO) {
    return {
      name: dto.name,
      iconKey: dto.iconKey,
      description: dto.description,
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
    };
  }

  static toUpdatePayload(dto: UpdatePetCategoryDTO) {
    const payload: any = {};
    if (dto.name !== undefined) payload.name = dto.name;
    if (dto.iconKey !== undefined) payload.iconKey = dto.iconKey;
    if (dto.description !== undefined) payload.description = dto.description;
    if (dto.isActive !== undefined) payload.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) payload.sortOrder = dto.sortOrder;
    return payload;
  }
}
