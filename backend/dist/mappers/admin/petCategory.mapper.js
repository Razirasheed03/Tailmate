"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetCategoryMapper = void 0;
class PetCategoryMapper {
    static toPetCategoryDTO(category) {
        var _a, _b, _c;
        return {
            id: ((_a = category._id) === null || _a === void 0 ? void 0 : _a.toString()) || "",
            name: category.name || "",
            iconKey: category.iconKey,
            description: category.description,
            isActive: (_b = category.isActive) !== null && _b !== void 0 ? _b : true,
            sortOrder: (_c = category.sortOrder) !== null && _c !== void 0 ? _c : 0,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        };
    }
    static toPetCategoryListResponseDTO(data, page, totalPages, total) {
        return {
            data: data.map((cat) => this.toPetCategoryDTO(cat)),
            page,
            totalPages,
            total,
        };
    }
    static toCreatePayload(dto) {
        return {
            name: dto.name,
            iconKey: dto.iconKey,
            description: dto.description,
            isActive: dto.isActive,
            sortOrder: dto.sortOrder,
        };
    }
    static toUpdatePayload(dto) {
        const payload = {};
        if (dto.name !== undefined)
            payload.name = dto.name;
        if (dto.iconKey !== undefined)
            payload.iconKey = dto.iconKey;
        if (dto.description !== undefined)
            payload.description = dto.description;
        if (dto.isActive !== undefined)
            payload.isActive = dto.isActive;
        if (dto.sortOrder !== undefined)
            payload.sortOrder = dto.sortOrder;
        return payload;
    }
}
exports.PetCategoryMapper = PetCategoryMapper;
