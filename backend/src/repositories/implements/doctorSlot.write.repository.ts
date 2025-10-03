// backend/src/repositories/implements/doctorSlot.write.repository.ts
import { Types } from "mongoose";
import { DoctorSlot } from "../../schema/doctorSlot.schema";

export class DoctorSlotWriteRepository {
  async markBooked(slotId: string) {
    if (!Types.ObjectId.isValid(slotId)) return null;
    const _id = new Types.ObjectId(slotId);
    const updated = await DoctorSlot.findOneAndUpdate(
      { _id, status: "available" },
      { $set: { status: "booked" } },
      { new: true }
    ).lean();
    return updated;
  }
}
