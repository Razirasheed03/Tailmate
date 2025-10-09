//repositories/implements/payment.repository.ts
import { IPayment, PaymentModel } from "../../models/implements/payment.model";

export class PaymentRepository {
  async create(data: Partial<IPayment>) {
    return await PaymentModel.create(data);
  }
  async update(id: string, updateData: Partial<IPayment>) {
    return await PaymentModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
  }
  async byDoctor(doctorId: string) {
    return await PaymentModel.find({ doctorId }).sort({ createdAt: -1 }).lean();
  }
}
