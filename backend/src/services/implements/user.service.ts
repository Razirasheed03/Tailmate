// backend/src/services/implements/user.service.ts
import { Types } from "mongoose";
import { UserRepository } from "../../repositories/implements/user.repository";
import { DoctorPublicRepository } from "../../repositories/implements/doctorPublic.repository";

export class UserService {
  constructor(
    private readonly _userRepo = new UserRepository(),
    private readonly _doctorPubRepo = new DoctorPublicRepository()
  ) {}

  private validateObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error("Invalid user id");
  }

  private validateUsername(username: string) {
    const val = (username ?? "").trim();
    if (val.length < 3) throw new Error("Username must be at least 3 characters");
    if (val.length > 30) throw new Error("Username is too long");
    return val;
  }

  async updateMyUsername(userId: string, username: string) {
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
  }): Promise<{ items: any[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 12));
    const search = (params.search || "").trim();
    const specialty = (params.specialty || "").trim();
    return this._doctorPubRepo.listVerifiedWithNextSlot({ page, limit, search, specialty });
  }

  async getDoctorPublicById(id: string) {
    return this._doctorPubRepo.getDoctorPublicById(id);
  }

  async listDoctorSlotsBetween(
    id: string,
    opts: { from: string; to: string; status?: "available" | "booked" }
  ) {
    return this._doctorPubRepo.listSlotsBetween(id, opts);
  }
    async listDoctorGeneratedAvailability(
    id: string,
    opts: { from: string; to: string }
  ) {
    return this._doctorPubRepo.listGeneratedAvailability(id, opts);
  }
}
