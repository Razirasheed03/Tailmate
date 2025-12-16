// repositories/interface/payment.repository.interface.ts

import { IPayment } from "../../models/implements/payment.model";

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
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

export interface IPaymentRepository {
  create(data: Partial<IPayment>): Promise<IPayment>;
  update(id: string, updateData: Partial<IPayment>): Promise<IPayment | null>;
  byDoctorPaginated(doctorId: string, params?: PaginationParams): Promise<PaginatedResult<IPayment>>;
  byDoctor(doctorId: string): Promise<IPayment[]>;
}