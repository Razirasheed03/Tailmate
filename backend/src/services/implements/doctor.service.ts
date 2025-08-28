import { IUserRepository } from "../../repositories/interfaces/user.repository.interface";
import { IDoctorRepository } from "../../repositories/interfaces/doctor.repository.interface";
import { UserRole } from "../../constants/roles";

export class DoctorService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly doctorRepo: IDoctorRepository
  ) {}

  private async ensureDoctor(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new Error("User not found");
    if (user.role !== UserRole.DOCTOR) throw new Error("Only doctors can access this resource");
  }

  async getVerification(userId: string) {
    await this.ensureDoctor(userId);
    await this.doctorRepo.createIfMissing(userId);
    return this.doctorRepo.getVerification(userId);
  }

  async submitCertificate(userId: string, certificateUrl: string) {
    await this.ensureDoctor(userId);
    if (!certificateUrl) throw new Error("certificateUrl is required");
    return this.doctorRepo.submitCertificate(userId, certificateUrl);
  }
}
