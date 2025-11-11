// src/mappers/admin/earnings.mapper.ts
import { DoctorEarningsDTO, EarningsResponseDTO } from "../../dtos/admin/earnings.dto";

export class EarningsMapper {
  static toDoctorEarningsDTO(aggregateResult: any): DoctorEarningsDTO {
    return {
      doctorId: aggregateResult._id?.toString() || "",
      doctorName: aggregateResult.doctor?.username || aggregateResult.doctor?.displayName || "Unknown",
      doctorEmail: aggregateResult.doctor?.email || "",
      totalEarnings: aggregateResult.totalEarnings || 0,
    };
  }

  static toEarningsResponseDTO(results: any[]): EarningsResponseDTO {
    const earnings = results.map((result) => this.toDoctorEarningsDTO(result));
    const totalEarnings = earnings.reduce((sum, d) => sum + (d.totalEarnings ?? 0), 0);
    return { totalEarnings, earnings };
  }
}
