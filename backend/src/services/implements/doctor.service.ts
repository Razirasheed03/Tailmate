import { IUserRepository } from "../../repositories/interfaces/user.repository.interface";
import { IDoctorRepository } from "../../repositories/interfaces/doctor.repository.interface";
import { UserRole } from "../../constants/roles";

export class DoctorService {
  constructor(
    private readonly _userRepo: IUserRepository,
    private readonly _doctorRepo: IDoctorRepository
  ) { }

  private async ensureDoctor(userId: string) {
    const user = await this._userRepo.findById(userId);
    if (!user) throw new Error("User not found");
    if (user.role !== UserRole.DOCTOR) throw new Error("Only doctors can access this resource");
  }

  async getVerification(userId: string) {
    await this.ensureDoctor(userId);
    await this._doctorRepo.createIfMissing(userId);
    return this._doctorRepo.getVerification(userId);
  }

  private async ensureVerified(userId: string) {
    const v = await this._doctorRepo.getVerification(userId);
    if (!v || v.status !== "verified") {
      const err: any = new Error("Profile is available after verification");
      err.status = 403;
      throw err;
    }
  }

  async submitCertificate(userId: string, certificateUrl: string) {
    await this.ensureDoctor(userId);
    if (!certificateUrl) throw new Error("certificateUrl is required");
    return this._doctorRepo.submitCertificate(userId, certificateUrl);
  }
  async getProfile(userId: string) {
    await this.ensureDoctor(userId);
    await this.ensureVerified(userId);
    return this._doctorRepo.getProfile(userId);
  }
  async updateProfile(userId: string, payload: Partial<{
    displayName: string;
    bio: string;
    specialties: string[];
    experienceYears: number;
    licenseNumber: string;
    avatarUrl: string;
    consultationFee: number;
  }>) {
    await this.ensureDoctor(userId);
    await this.ensureVerified(userId);
    const profile: any = {};
    if (typeof payload.displayName === "string") profile.displayName = payload.displayName.trim();
    if (typeof payload.bio === "string") {
      const bio = payload.bio.trim();
      if (bio.length > 5000) throw new Error("Bio is too long");
      profile.bio = bio;
    }
    if (Array.isArray(payload.specialties)) {
      profile.specialties = Array.from(new Set(payload.specialties.map(s => String(s).trim()).filter(Boolean)));
    }
    if (typeof payload.experienceYears === "number") {
      if (payload.experienceYears < 0 || payload.experienceYears > 80) throw new Error("Experience out of range");
      profile.experienceYears = payload.experienceYears;
    }
    if (typeof payload.licenseNumber === "string") profile.licenseNumber = payload.licenseNumber.trim();
    if (typeof payload.avatarUrl === "string") profile.avatarUrl = payload.avatarUrl.trim();
    if (typeof payload.consultationFee === "number") {
      if (payload.consultationFee < 0) throw new Error("Fee cannot be negative");
      profile.consultationFee = payload.consultationFee;
    }

    return this._doctorRepo.updateProfile(userId, profile);
  }
}
