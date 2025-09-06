// src/repositories/interfaces/admin.repository.interface.ts
export interface IAdminRepository {
  listDoctors(params: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
  }): Promise<{
    data: Array<{
      userId: any;
      username: string;
      email: string;
      status: "pending" | "verified" | "rejected";
      certificateUrl?: string;
      submittedAt?: Date;
    }>;
    page: number;
    totalPages: number;
    total: number;
  }>;

  verifyDoctor(userId: string, reviewerId: string): Promise<any>;
  rejectDoctor(userId: string, reviewerId: string, reasons: string[]): Promise<any>;
    getDoctorDetail(userId: string): Promise<any>;
}
