"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetCategory = void 0;
// schema/petCategory.schema.ts
const mongoose_1 = require("mongoose");
const PetCategorySchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    iconKey: { type: String, default: "" },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
PetCategorySchema.index({ name: 1 }, {
    unique: true,
    collation: { locale: "en", strength: 2 },
});
PetCategorySchema.index({ isActive: 1, sortOrder: 1 });
exports.PetCategory = (0, mongoose_1.model)("PetCategory", PetCategorySchema);
