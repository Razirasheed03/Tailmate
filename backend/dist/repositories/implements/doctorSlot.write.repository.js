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
exports.DoctorSlotWriteRepository = void 0;
// backend/src/repositories/implements/doctorSlot.write.repository.ts
const mongoose_1 = require("mongoose");
const doctorSlot_schema_1 = require("../../schema/doctorSlot.schema");
class DoctorSlotWriteRepository {
    // Book the slot if it's still available; returns the updated doc or null if race lost
    markBooked(slotId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(slotId))
                return null;
            const _id = new mongoose_1.Types.ObjectId(slotId);
            const updated = yield doctorSlot_schema_1.DoctorSlot.findOneAndUpdate({ _id, status: "available" }, { $set: { status: "booked" } }, { new: true }).lean();
            return updated;
        });
    }
}
exports.DoctorSlotWriteRepository = DoctorSlotWriteRepository;
