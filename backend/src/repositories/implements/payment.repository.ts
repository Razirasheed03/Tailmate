//repositories/implements/payment.repository.ts
import { IPayment, PaymentModel } from "../../models/implements/payment.model";
interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
export class PaymentRepository {
  async create(data: Partial<IPayment>) {
    return await PaymentModel.create(data);
  }
  async update(id: string, updateData: Partial<IPayment>) {
    return await PaymentModel.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
  }
  async byDoctorPaginated(
  doctorId: string,
  params: PaginationParams = {}
): Promise<PaginatedResult<any>> {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    order = 'desc'
  } = params;

  // Ensure valid page and limit
  const currentPage = Math.max(1, page);
  const perPage = Math.min(Math.max(1, limit), 100); // Max 100 items per page
  const skip = (currentPage - 1) * perPage;

  // Build sort object
  const sortOrder = order === 'asc' ? 1 : -1;
  const sortObj: any = { [sortBy]: sortOrder };

  // Get total count for pagination metadata
  const totalItems = await PaymentModel.countDocuments({ doctorId });
  const totalPages = Math.ceil(totalItems / perPage);

  // Fetch paginated data
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

  async byDoctor(doctorId: string) {
    return await PaymentModel.find({ doctorId }).sort({ createdAt: -1 }).lean();
  }
}
