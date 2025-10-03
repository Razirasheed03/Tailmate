// backend/src/repositories/implements/doctorSlot.read.repository.ts
import { Types } from "mongoose";
import { DoctorSlot } from "../../schema/doctorSlot.schema";

export class DoctorSlotReadRepository {
  async findExactAvailable(doctorId: string, date: string, time: string) {
    if (!Types.ObjectId.isValid(doctorId)) return null;
    const slot = await DoctorSlot.findOne({
      userId: new Types.ObjectId(doctorId),
      date,
      time,
      status: "available",
    }).lean();
    return slot;
  }
}
