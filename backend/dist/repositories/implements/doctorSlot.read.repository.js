"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorSlotReadRepository = void 0;
// backend/src/repositories/implements/doctorSlot.read.repository.ts
const mongoose_1 = require("mongoose");
const doctorSlot_schema_1 = require("../../schema/doctorSlot.schema");
class DoctorSlotReadRepository {
    // Find a slot by doctor+date+time and ensure it is "available"
    findExactAvailable(doctorId, date, time) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(doctorId))
                return null;
            const slot = yield doctorSlot_schema_1.DoctorSlot.findOne({
                userId: new mongoose_1.Types.ObjectId(doctorId),
                date,
                time,
                status: "available",
            }).lean();
            return slot;
        });
    }
}
exports.DoctorSlotReadRepository = DoctorSlotReadRepository;
