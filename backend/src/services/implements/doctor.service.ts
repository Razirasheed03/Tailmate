// backend/src/services/implements/doctor.service.ts
import { IUserRepository } from "../../repositories/interfaces/user.repository.interface";
import { IDoctorRepository } from "../../repositories/interfaces/doctor.repository.interface";
import { UserRole } from "../../constants/roles";
import { DoctorSlot, DoctorSlotEntity } from "../../schema/doctorSlot.schema";
import { Model, Schema, model, Types } from "mongoose";
import { IDoctorVerification, IDoctorProfile, IDoctorModel, UpdateProfileDTO } from "../../models/interfaces/doctor.model.interface";
import { stripe } from "../../utils/stripe";
import { DoctorModel } from "../../models/implements/doctor.model";
import { UserModel } from "../../models/implements/user.model";


// Domain type for consultation modes (not a DTO)
type UIMode = "video" | "audio" | "inPerson";

// Weekly fixture rule used by generation (domain shape)
type FixtureRule = {
  weekday: number;
  enabled: boolean;
  slotLengthMins: number;
  fixtures?: Array<{ time: string; fee: number; modes: UIMode[] }>;
  times?: string[];
  modes?: UIMode[];
  fee?: number;
  start?: string;
  end?: string;
};

// Public output types for clarity
type WeeklyRuleView = {
  weekday: number;
  enabled: boolean;
  slotLengthMins: number;
  fixtures: Array<{ time: string; fee: number; modes: UIMode[] }>;
};

type GeneratedAvailability = Record<
  string,
  Array<{ date: string; time: string; durationMins: number; modes: UIMode[] | string[]; fee: number }>
>;

export class DoctorService {
  constructor(
    private readonly _userRepo: IUserRepository,
    private readonly _doctorRepo: IDoctorRepository
  ) {}

 private async ensureDoctor(userId: string): Promise<void> {
    const user = await this._userRepo.findById(userId);
    if (!user) throw new Error("User not found");
    if (user.role !== UserRole.DOCTOR) {
      throw new Error("Only doctors can access this resource");
    }
  }

  async getVerification(userId: string): Promise<IDoctorVerification> {
    await this.ensureDoctor(userId);
    await this._doctorRepo.createIfMissing(userId);
    return this._doctorRepo.getVerification(userId);
  }

  async uploadCertificate(userId: string, certificateUrl: string): Promise<IDoctorVerification> {
    await this.ensureDoctor(userId);
    if (!certificateUrl) throw new Error("certificateUrl is required");
    return this._doctorRepo.saveCertificateUrl(userId, certificateUrl);
  }

  private isProfileComplete(profile: IDoctorProfile): boolean {
    return !!(
      profile?.displayName?.trim() &&
      profile?.bio?.trim() &&
      profile?.specialties &&
      profile.specialties.length > 0 &&
      typeof profile?.experienceYears === "number" &&
      profile?.licenseNumber?.trim() &&
      typeof profile?.consultationFee === "number"
    );
  }

  async submitForReview(userId: string): Promise<IDoctorModel> {
    await this.ensureDoctor(userId);
    
    const doc = await this._doctorRepo.getVerification(userId);
    if (!doc?.certificateUrl) {
      throw new Error("Please upload a certificate first");
    }

    const profile = await this._doctorRepo.getProfile(userId).catch(() => ({}));
    
    if (!this.isProfileComplete(profile)) {
      throw new Error("Please complete all required profile fields (name, bio, specialties, experience, license, fee)");
    }

    return this._doctorRepo.submitForReview(userId);
  }

  async getProfile(userId: string): Promise<IDoctorProfile> {
    await this.ensureDoctor(userId);
    return this._doctorRepo.getProfile(userId);
  }

  async updateProfile(userId: string, payload: Partial<UpdateProfileDTO>): Promise<IDoctorProfile> {
    await this.ensureDoctor(userId);

    const profile: Partial<UpdateProfileDTO> = {};

    if (typeof payload.displayName === "string") {
      profile.displayName = payload.displayName.trim();
    }
    
    if (typeof payload.bio === "string") {
      const bio = payload.bio.trim();
      if (bio.length > 5000) throw new Error("Bio is too long");
      profile.bio = bio;
    }
    
    if (Array.isArray(payload.specialties)) {
      profile.specialties = Array.from(
        new Set(payload.specialties.map((s) => String(s).trim()).filter(Boolean))
      );
    }
    
    if (typeof payload.experienceYears === "number") {
      if (payload.experienceYears < 0 || payload.experienceYears > 80) {
        throw new Error("Experience out of range");
      }
      profile.experienceYears = payload.experienceYears;
    }
    
    if (typeof payload.licenseNumber === "string") {
      profile.licenseNumber = payload.licenseNumber.trim();
    }
    
    if (typeof payload.avatarUrl === "string") {
      profile.avatarUrl = payload.avatarUrl.trim();
    }
    
    if (typeof payload.consultationFee === "number") {
      if (payload.consultationFee < 0) throw new Error("Fee cannot be negative");
      profile.consultationFee = payload.consultationFee;
    }

    return this._doctorRepo.updateProfile(userId, profile);
  }


  // ===== Legacy per-day availability kept (unchanged) =====
  private toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  }
  private overlaps(aStart: number, aDur: number, bStart: number, bDur: number): boolean {
    const aEnd = aStart + aDur;
    const bEnd = bStart + bDur;
    return aStart < bEnd && aEnd > bStart;
  }
  private ymd(d: Date): string {
    const y = d.getFullYear(),
      m = String(d.getMonth() + 1).padStart(2, "0"),
      dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }
  private within4Days(date: string): boolean {
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
    return DoctorSlot.find({ userId: new Types.ObjectId(userId), date }).lean<DoctorSlotEntity[]>().exec();
  }

  async saveDaySchedule(
    userId: string,
    payload: {
      date: string;
      slots: Array<{
        time: string;
        durationMins: number;
        fee: number;
        modes: ("video" | "audio" | "inPerson")[];
        status: "available" | "booked";
      }>;
    }
  ): Promise<DoctorSlotEntity[]> {
    await this.ensureDoctor(userId);
    if (!this.within4Days(payload.date)) throw new Error("Date out of allowed range [today..+3]");
    const uId = new Types.ObjectId(userId);
    const sorted = [...payload.slots].sort((a, b) => a.time.localeCompare(b.time));
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        if (
          this.overlaps(
            this.toMinutes(sorted[i].time),
            sorted[i].durationMins,
            this.toMinutes(sorted[j].time),
            sorted[j].durationMins
          )
        ) {
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

  async createDaySlot(
    userId: string,
    slot: {
      date: string;
      time: string;
      durationMins: number;
      fee: number;
      modes: ("video" | "audio" | "inPerson")[];
      status?: "available" | "booked";
    }
  ): Promise<DoctorSlotEntity> {
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

  async updateSlotStatus(
    userId: string,
    slotId: string,
    status: "available" | "booked"
  ): Promise<DoctorSlotEntity | null> {
    await this.ensureDoctor(userId);
    return DoctorSlot.findOneAndUpdate(
      { _id: new Types.ObjectId(slotId), userId: new Types.ObjectId(userId) },
      { $set: { status } },
      { new: true }
    )
      .lean<DoctorSlotEntity>()
      .exec();
  }

  async deleteDaySlot(userId: string, slotId: string): Promise<boolean> {
    await this.ensureDoctor(userId);
    const r = await DoctorSlot.deleteOne({
      _id: new Types.ObjectId(slotId),
      userId: new Types.ObjectId(userId),
    }).exec();
    return r.deletedCount === 1;
  }

  // ===== Sessions (unchanged) =====
  async listSessions(
    doctorId: string,
    opts: {
      page: number;
      limit: number;
      scope: "upcoming" | "today" | "past";
      mode?: "video" | "audio" | "inPerson";
      q?: string;
    }
  ): Promise<any> {
    // Replace any with repository’s Paginated<Session> type
    await this.ensureDoctor(doctorId);
    return this._doctorRepo.listSessions(doctorId, opts);
  }

  async getSession(doctorId: string, bookingId: string): Promise<any> {
    // Replace any with concrete SessionDetail type
    await this.ensureDoctor(doctorId);
    return this._doctorRepo.getSession(doctorId, bookingId);
  }

  // ===== Weekly fixtures model =====
  private static WeeklyRuleModel: Model<any> = (() => {
    const FixtureSchema = new Schema(
      {
        time: { type: String, required: true }, // "HH:mm"
        fee: { type: Number, min: 0, default: 0 },
        modes: { type: [String], enum: ["video", "audio", "inPerson"], default: ["video"] },
      },
      { _id: false }
    );

    const WeeklyRuleSchema = new Schema(
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
        weekday: { type: Number, min: 0, max: 6, index: true, required: true },
        enabled: { type: Boolean, default: false },
        fixtures: { type: [FixtureSchema], default: [] }, // NEW per-time fixtures
        slotLengthMins: { type: Number, min: 5, max: 120, default: 30 },
        // Back-compat legacy fields (ignored if fixtures present)
        times: { type: [String], default: [] },
        start: { type: String, default: "" },
        end: { type: String, default: "" },
        modes: { type: [String], enum: ["video", "audio", "inPerson"], default: ["video"] },
        fee: { type: Number, min: 0, default: 0 },
      },
      { timestamps: true }
    );

    WeeklyRuleSchema.index({ userId: 1, weekday: 1 }, { unique: true });
    return model("DoctorWeeklyRule", WeeklyRuleSchema);
  })();

  async getWeeklyRules(userId: string): Promise<WeeklyRuleView[]> {
    await this.ensureDoctor(userId);
    const uId = new Types.ObjectId(userId);
    const rows = await DoctorService.WeeklyRuleModel.find({ userId: uId }).lean().exec();
    const byW = new Map<number, any>();
    rows.forEach((r: any) => byW.set(r.weekday, r));
    const out: WeeklyRuleView[] = Array.from({ length: 7 }, (_, w) => {
      const r = byW.get(w);
      const fixtures =
        Array.isArray(r?.fixtures) && r.fixtures.length
          ? r.fixtures.map((f: any) => ({
              time: String(f.time),
              fee: Number(f.fee) || 0,
              modes: Array.isArray(f.modes) && f.modes.length ? (f.modes as UIMode[]) : (["video"] as UIMode[]),
            }))
          : Array.isArray(r?.times) && r.times.length
          ? r.times.map((t: any) => ({
              time: String(t),
              fee: Number(r?.fee) || 0,
              modes: Array.isArray(r?.modes) && r.modes.length ? (r.modes as UIMode[]) : (["video"] as UIMode[]),
            }))
          : [];
      return {
        weekday: w,
        enabled: !!r?.enabled,
        slotLengthMins: r?.slotLengthMins || 30,
        fixtures,
      };
    });
    return out;
  }

  async saveWeeklyRules(
    userId: string,
    rules: Array<{
      weekday: number;
      enabled: boolean;
      slotLengthMins: number;
      fixtures: Array<{ time: string; fee: number; modes: UIMode[] }>;
    }>
  ): Promise<WeeklyRuleView[]> {
    await this.ensureDoctor(userId);
    const uId = new Types.ObjectId(userId);
    const clean = (rules || []).filter((r) => r && r.weekday >= 0 && r.weekday <= 6);
    for (const r of clean) {
      const fixtures = Array.isArray(r.fixtures)
        ? r.fixtures
            .map((f) => ({
              time: String(f.time),
              fee: Number(f.fee) || 0,
              modes: Array.isArray(f.modes) && f.modes.length ? f.modes : (["video"] as UIMode[]),
            }))
            .filter((f) => /^\d{2}:\d{2}$/.test(f.time))
        : [];
      await DoctorService.WeeklyRuleModel.updateOne(
        { userId: uId, weekday: r.weekday },
        {
          $set: {
            enabled: !!r.enabled,
            slotLengthMins: Number(r.slotLengthMins) || 30,
            fixtures,
            // Clear legacy fields when saving fixtures
            times: [],
            start: "",
            end: "",
            modes: ["video"],
            fee: 0,
          },
        },
        { upsert: true }
      ).exec();
    }
    return this.getWeeklyRules(userId);
  }

  async generateAvailability(
    userId: string,
    fromYMD: string,
    toYMD: string,
    rules?: FixtureRule[]
  ): Promise<GeneratedAvailability> {
    await this.ensureDoctor(userId);
    if (!fromYMD || !toYMD) {
      const err: any = new Error("from and to are required (YYYY-MM-DD)");
      err.status = 400;
      throw err;
    }

    const ruleList: FixtureRule[] = Array.isArray(rules) && rules.length ? rules : await this.getWeeklyRules(userId);

    const byW = new Map<number, FixtureRule>();
    ruleList.forEach((r) => byW.set(Number(r.weekday), r));

    type OutSlot = { date: string; time: string; durationMins: number; modes: string[]; fee: number };
    const out: Record<string, OutSlot[]> = {};

    const startDate = new Date(`${fromYMD}T00:00:00Z`);
    const endDate = new Date(`${toYMD}T00:00:00Z`);

    for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
      const ymd = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
        d.getUTCDate()
      ).padStart(2, "0")}`;
      const w = d.getUTCDay();
      const r = byW.get(w);
      out[ymd] = [];
      if (!r || !r.enabled) continue;

      const duration = Number(r.slotLengthMins) || 30;

      if (Array.isArray(r.fixtures) && r.fixtures.length) {
        const uniqTimes = new Set<string>();
        for (const f of r.fixtures) {
          const t = String(f.time);
          if (!/^\d{2}:\d{2}$/.test(t)) continue;
          if (uniqTimes.has(t)) continue;
          uniqTimes.add(t);
          const fee = Number(f.fee) || 0;
          const modes = Array.isArray(f.modes) && f.modes.length ? f.modes : (["video"] as UIMode[]);
          out[ymd].push({ date: ymd, time: t, durationMins: duration, modes, fee });
        }
        out[ymd].sort((a, b) => a.time.localeCompare(b.time));
      }
    }

    return out as GeneratedAvailability;
  }
async createStripeOnboarding(userId: string): Promise<{ url: string | null; alreadyConnected: boolean }> {
  const doctor = await DoctorModel.findOne({ userId });
  if (!doctor) throw new Error("Doctor not found");
  const user = await UserModel.findById(userId);
  const doctorEmail = user?.email;
  if (!doctorEmail || !doctorEmail.includes("@")) throw new Error("Doctor email not found or invalid");

  if (doctor.stripeAccountId) {
    const acct = await stripe.accounts.retrieve(doctor.stripeAccountId);

    // If account is incompletely onboarded or payouts not enabled
    if (!(acct && acct.payouts_enabled && acct.charges_enabled)) {
      // Always generate an onboarding link for incomplete status
      const accountLink = await stripe.accountLinks.create({
        account: doctor.stripeAccountId,
        refresh_url: process.env.APP_URL + "/doctor/wallet?connect=refresh",
        return_url: process.env.APP_URL + "/doctor/wallet?connect=return",
        type: "account_onboarding",
      });
      return { url: accountLink.url, alreadyConnected: false };
    }
    // Onboarding finished
    return { url: null, alreadyConnected: true };
  }

  // No stripe account: create one and immediately offer onboarding
  const account = await stripe.accounts.create({
    type: "express",
    country: "US",
    email: doctorEmail,
  });
  doctor.stripeAccountId = account.id;
  doctor.stripeOnboardingStatus = "pending";
  await doctor.save();
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: process.env.APP_URL + "/doctor/wallet?connect=refresh",
    return_url: process.env.APP_URL + "/doctor/wallet?connect=return",
    type: "account_onboarding",
  });
  return { url: accountLink.url, alreadyConnected: false };
}




}
