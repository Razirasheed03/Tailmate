// backend/src/services/implements/user.service.ts
import { Types } from "mongoose";
import { UserRepository } from "../../repositories/implements/user.repository";
import { DoctorPublicRepository } from "../../repositories/implements/doctorPublic.repository";

export type PublicDoctor = any;
export type PublicDoctorWithNextSlot = any;
export type PaginatedDoctors = {
  items: PublicDoctorWithNextSlot[];
  total: number;
  page: number;
  limit: number;
};

export class UserService {
  constructor(
    private readonly _userRepo = new UserRepository(),
    private readonly _doctorPubRepo = new DoctorPublicRepository()
  ) {}

  private validateObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) throw new Error("Invalid user id");
  }

  private validateUsername(username: string): string {
    const val = (username ?? "").trim();
    if (val.length < 3) throw new Error("Username must be at least 3 characters");
    if (val.length > 30) throw new Error("Username is too long");
    return val;
  }

  async updateMyUsername(userId: string, username: string): Promise<any> {
    // Replace any with repository's updated user DTO
    this.validateObjectId(userId);
    const newUsername = this.validateUsername(username);
    const updated = await this._userRepo.updateUsername(userId, newUsername);
    if (!updated) throw new Error("User not found");
    return updated;
  }

  async listDoctorsWithNextSlot(params: {
    page?: number;
    limit?: number;
    search?: string;
    specialty?: string;
  }): Promise<PaginatedDoctors> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 12));
    const search = (params.search || "").trim();
    const specialty = (params.specialty || "").trim();
    return this._doctorPubRepo.listVerifiedWithNextSlot({ page, limit, search, specialty });
  }

  async getDoctorPublicById(id: string): Promise<PublicDoctor | null> {
    return this._doctorPubRepo.getDoctorPublicById(id);
  }

  async listDoctorGeneratedAvailability(
    id: string,
    opts: { from: string; to: string }
  ): Promise<
    Array<{
      date: string;
      time: string;
      durationMins: number;
      modes: string[]; // or a refined union if repo guarantees
      fee?: number;
    }>
  > {
    return this._doctorPubRepo.listGeneratedAvailability(id, opts);
  }
}
