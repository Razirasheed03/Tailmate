// src/dtos/admin/earnings.dto.ts
export interface DoctorEarningsDTO {
  doctorId: string;
  doctorName: string;
  doctorEmail: string;
  totalEarnings: number;
}

export interface EarningsResponseDTO {
  totalEarnings: number; 
  earnings: DoctorEarningsDTO[];
}
