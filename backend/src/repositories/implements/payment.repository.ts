// repositories/implements/payment.repository.ts

import { IPayment, PaymentModel } from "../../models/implements/payment.model";
import { 
  IPaymentRepository, 
  PaginationParams, 
  PaginatedResult 
} from "../interfaces/payment.repository.interface";

export class PaymentRepository implements IPaymentRepository {
  async create(data: Partial<IPayment>): Promise<IPayment> {
    return await PaymentModel.create(data);
  }

  async update(id: string, updateData: Partial<IPayment>): Promise<IPayment | null> {
    return await PaymentModel.findByIdAndUpdate(
      id, 
      { $set: updateData }, 
      { new: true }
    ).lean();
  }

  async byDoctorPaginated(
    doctorId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResult<IPayment>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc'
    } = params;

    const currentPage = Math.max(1, page);
    const perPage = Math.min(Math.max(1, limit), 100);
    const skip = (currentPage - 1) * perPage;

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj: any = { [sortBy]: sortOrder };

    const totalItems = await PaymentModel.countDocuments({ doctorId });
    const totalPages = Math.ceil(totalItems / perPage);

    const data = await PaymentModel.find({ doctorId })
      .sort(sortObj)
      .skip(skip)
      .limit(perPage)
      .lean();

    return {
      data,
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        perPage,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
      }
    };
  }

  async byDoctor(doctorId: string): Promise<IPayment[]> {
    return await PaymentModel.find({ doctorId })
      .sort({ createdAt: -1 })
      .lean();
  }
}