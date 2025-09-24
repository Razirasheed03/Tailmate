// backend/src/services/implements/doctor.service.ts
import { IUserRepository } from "../../repositories/interfaces/user.repository.interface";
import { IDoctorRepository } from "../../repositories/interfaces/doctor.repository.interface";
import { UserRole } from "../../constants/roles";
import { DoctorSlot, DoctorSlotEntity } from "../../schema/doctorSlot.schema";
import { Types } from "mongoose";

export class DoctorService {
  constructor(
    private readonly _userRepo: IUserRepository,
    private readonly _doctorRepo: IDoctorRepository
  ) {}

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

  // ========= Simple availability =========

  private toMinutes(hhmm: string) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  }
  private overlaps(aStart: number, aDur: number, bStart: number, bDur: number) {
    const aEnd = aStart + aDur;
    const bEnd = bStart + bDur;
    return aStart < bEnd && aEnd > bStart;
  }
  private ymd(d: Date) {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }
  private within4Days(date: string) {
    const today = new Date();
    const min = this.ymd(today);
    const maxD = new Date(today);
    maxD.setDate(today.getDate() + 3);
    const max = this.ymd(maxD);
    return date >= min && date <= max;
  }

  async listDaySlots(userId: string, date: string): Promise<DoctorSlotEntity[]> {
    await this.ensureDoctor(userId);
    if (!this.within4Days(date)) throw new Error("Date out of allowed range [today..+3]");
    return DoctorSlot.find({ userId: new Types.ObjectId(userId), date })
      .lean<DoctorSlotEntity[]>()
      .exec();
  }

  async saveDaySchedule(userId: string, payload: { date: string; slots: Array<{
    time: string; durationMins: number; fee: number; modes: ("video"|"audio"|"inPerson")[]; status: "available"|"booked";
  }>}): Promise<DoctorSlotEntity[]> {
    await this.ensureDoctor(userId);
    if (!this.within4Days(payload.date)) throw new Error("Date out of allowed range [today..+3]");
    const uId = new Types.ObjectId(userId);

    // check overlaps in incoming payload
    const sorted = [...payload.slots].sort((a, b) => a.time.localeCompare(b.time));
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        if (this.overlaps(this.toMinutes(sorted[i].time), sorted[i].durationMins, this.toMinutes(sorted[j].time), sorted[j].durationMins)) {
          throw new Error(`Overlap between ${sorted[i].time} and ${sorted[j].time}`);
        }
      }
    }

    await DoctorSlot.deleteMany({ userId: uId, date: payload.date }).exec();
    const docs = sorted.map((s) => ({
      userId: uId,
      date: payload.date,
      time: s.time,
      durationMins: s.durationMins,
      fee: s.fee ?? 0,
      modes: s.modes?.length ? s.modes : ["video"],
      status: s.status ?? "available",
    }));
    if (docs.length) await DoctorSlot.insertMany(docs, { ordered: true });
    return DoctorSlot.find({ userId: uId, date: payload.date }).lean<DoctorSlotEntity[]>().exec();
  }

  async createDaySlot(userId: string, slot: {
    date: string; time: string; durationMins: number; fee: number; modes: ("video"|"audio"|"inPerson")[]; status?: "available"|"booked";
  }): Promise<DoctorSlotEntity> {
    await this.ensureDoctor(userId);
    if (!this.within4Days(slot.date)) throw new Error("Date out of allowed range [today..+3]");
    const uId = new Types.ObjectId(userId);

    const existing = await DoctorSlot.find({ userId: uId, date: slot.date }).lean<DoctorSlotEntity[]>().exec();
    const start = this.toMinutes(slot.time);
    const conflict = existing.some((s) => this.overlaps(start, slot.durationMins, this.toMinutes(s.time), s.durationMins));
    if (conflict) throw new Error("Conflicts with an existing slot");

    const created = await DoctorSlot.create({
      userId: uId,
      date: slot.date,
      time: slot.time,
      durationMins: slot.durationMins,
      fee: slot.fee ?? 0,
      modes: slot.modes?.length ? slot.modes : ["video"],
      status: slot.status ?? "available",
    });
    return created.toObject();
  }

  async updateSlotStatus(userId: string, slotId: string, status: "available" | "booked"): Promise<DoctorSlotEntity | null> {
    await this.ensureDoctor(userId);
    return DoctorSlot.findOneAndUpdate(
      { _id: new Types.ObjectId(slotId), userId: new Types.ObjectId(userId) },
      { $set: { status } },
      { new: true }
    ).lean<DoctorSlotEntity>().exec();
  }

  async deleteDaySlot(userId: string, slotId: string): Promise<boolean> {
    await this.ensureDoctor(userId);
    const r = await DoctorSlot.deleteOne({ _id: new Types.ObjectId(slotId), userId: new Types.ObjectId(userId) }).exec();
    return r.deletedCount === 1;
  }
}
