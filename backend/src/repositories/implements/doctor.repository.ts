import { Model } from "mongoose";
import { DoctorModel } from "../../models/implements/doctor.model";
import { IDoctorRepository } from "../interfaces/doctor.repository.interface";

export class DoctorRepository implements IDoctorRepository {
  constructor(private readonly model: Model<any> = DoctorModel) {}

  async createIfMissing(userId: string) {
    let doc = await this.model.findOne({ userId });
    if (!doc) {
      doc = await this.model.create({ userId, verification: { status: "pending" } });
    }
    return doc;
  }

  async getVerification(userId: string) {
    const doc = await this.model.findOne({ userId }).select("verification");
    if (!doc) return { status: "pending", rejectionReasons: [] };
    return doc.verification;
  }

  async submitCertificate(userId: string, certificateUrl: string) {
    const now = new Date();
    const updated = await this.model.findOneAndUpdate(
      { userId },
      {
        $set: {
          "verification.certificateUrl": certificateUrl,
          "verification.status": "pending",
          "verification.rejectionReasons": [],
          "verification.submittedAt": now,
        },
      },
      { new: true, upsert: true }
    ).select("verification");
    if (!updated) throw new Error("Doctor not found");
    return updated;
  }
}
