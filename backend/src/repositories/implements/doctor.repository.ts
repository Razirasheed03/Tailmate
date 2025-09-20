import { Model } from "mongoose";
import { DoctorModel } from "../../models/implements/doctor.model";
import { IDoctorRepository } from "../interfaces/doctor.repository.interface";

export class DoctorRepository implements IDoctorRepository {
  constructor(private readonly model: Model<any> = DoctorModel) {}

  async createIfMissing(userId: string) {
    let doc = await this.model.findOne({ userId });
    if (!doc) {
      doc = await this.model.create({
        userId,
        verification: { status: "pending" },
      });
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
    const updated = await this.model
      .findOneAndUpdate(
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
      )
      .select("verification");
    if (!updated) throw new Error("Doctor not found");
    return updated;
  }
  async getProfile(userId: string) {
    const doc = await this.model.findOne({ userId }).select("profile");
    if (!doc) return {};
    return doc.profile || {};
  }

  async updateProfile(userId: string, profile: Partial<any>) {
    const $set: Record<string, any> = {};

    if (typeof profile.displayName === "string")
      $set["profile.displayName"] = profile.displayName;
    if (typeof profile.bio === "string") $set["profile.bio"] = profile.bio;
    if (Array.isArray(profile.specialties))
      $set["profile.specialties"] = profile.specialties;
    if (typeof profile.experienceYears === "number")
      $set["profile.experienceYears"] = profile.experienceYears;
    if (typeof profile.licenseNumber === "string")
      $set["profile.licenseNumber"] = profile.licenseNumber;
    if (typeof profile.avatarUrl === "string")
      $set["profile.avatarUrl"] = profile.avatarUrl;
    if (typeof profile.consultationFee === "number")
      $set["profile.consultationFee"] = profile.consultationFee;

    // If nothing to set, just return current profile
    if (Object.keys($set).length === 0) {
      const doc = await this.model.findOne({ userId }).select("profile");
      if (!doc) throw new Error("Doctor not found");
      return doc.profile || {};
    }

    const updated = await this.model
      .findOneAndUpdate({ userId }, { $set }, { new: true, upsert: true })
      .select("profile");

    if (!updated) throw new Error("Doctor not found");
    return updated.profile || {};
  }
}
