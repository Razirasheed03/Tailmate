// repositories/implements/doctorPublic.repository.ts

import { PipelineStage, Types, Model, Schema, model } from "mongoose";
import { Doctor } from "../../schema/doctor.schema";
import { DoctorSlot } from "../../schema/doctorSlot.schema";
import { Booking } from "../../schema/booking.schema";
import {
  IDoctorPublicRepository,
  UIMode,
  DoctorListParams,
  DoctorListResult,
  GeneratedAvailabilityOptions,
  GeneratedSlot,
} from "../interfaces/doctorPublic.repository.interface";

type WeeklyRule = {
  userId: Types.ObjectId;
  weekday: number;
  enabled: boolean;
  slotLengthMins: number;
  fixtures: Array<{ time: string; fee: number; modes: UIMode[] | string[] }>;
  times?: string[];
  start?: string;
  end?: string;
  modes?: UIMode[] | string[];
  fee?: number;
};

function isUIMode(x: unknown): x is UIMode {
  return x === "video" || x === "audio" || x === "inPerson";
}

function toUIModes(input: unknown): UIMode[] {
  if (!Array.isArray(input)) return ["video"];
  const narrowed = (input as unknown[]).filter(isUIMode);
  return narrowed.length ? narrowed : ["video"];
}

function ymdUTC(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function hmUTC(d: Date) {
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

const WeeklyRuleSchema = new Schema<WeeklyRule>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
    weekday: { type: Number, min: 0, max: 6, index: true, required: true },
    enabled: { type: Boolean, default: false },
    slotLengthMins: { type: Number, min: 5, max: 120, default: 30 },
    fixtures: { type: [{ time: String, fee: Number, modes: [String] }], default: [] },
    times: { type: [String], default: [] },
    start: { type: String, default: "" },
    end: { type: String, default: "" },
    modes: { type: [String], default: ["video"] },
    fee: { type: Number, default: 0 },
  },
  { collection: "doctorweeklyrules" }
);

const DoctorWeeklyRule: Model<WeeklyRule> = model<WeeklyRule>(
  "DoctorWeeklyRule_Public",
  WeeklyRuleSchema
);

export class DoctorPublicRepository implements IDoctorPublicRepository {
  async listVerifiedWithNextSlot(params: DoctorListParams): Promise<DoctorListResult> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 12));
    const search = (params.search || "").trim();
    const specialty = (params.specialty || "").trim();

    const matchDoctor: PipelineStage.Match = {
      $match: {
        "verification.status": "verified",
        ...(search
          ? {
              $or: [
                { "profile.displayName": { $regex: search, $options: "i" } },
                { "profile.bio": { $regex: search, $options: "i" } },
              ],
            }
          : {}),
        ...(specialty ? { "profile.specialties": specialty } : {}),
      },
    };

    const pipeline: PipelineStage[] = [
      matchDoctor,
      {
        $project: {
          userId: 1,
          doctorId: "$userId",
          displayName: "$profile.displayName",
          avatarUrl: "$profile.avatarUrl",
          experienceYears: "$profile.experienceYears",
          specialties: "$profile.specialties",
          consultationFee: "$profile.consultationFee",
        },
      },
      { $sort: { displayName: 1 } },
      {
        $facet: {
          items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          total: [{ $count: "count" }],
        },
      },
      {
        $project: {
          items: 1,
          total: { $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0] },
        },
      },
    ];

    const [result] = await Doctor.aggregate(pipeline).exec();
    const items = (result?.items || []) as Array<{
      userId: Types.ObjectId;
      doctorId: Types.ObjectId;
      displayName?: string;
      avatarUrl?: string;
      experienceYears?: number;
      specialties?: string[];
      consultationFee?: number;
    }>;
    const total = result?.total || 0;

    if (!items.length) {
      return { items: [], total, page, limit };
    }

    const ids = items.map((d) => d.userId);
    const rules = await DoctorWeeklyRule.find({ userId: { $in: ids } })
      .lean()
      .exec();

    const byUid = new Map<string, WeeklyRule[]>();
    for (const r of rules) {
      const k = String(r.userId);
      const arr = byUid.get(k) || [];
      arr.push(r);
      byUid.set(k, arr);
    }

    const today = new Date();
    const horizonDays = 14;
    function ymd(d: Date) {
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    }

    const enriched = await Promise.all(
      items.map(async (doc) => {
        const uid = String(doc.userId);
        const rulesFor = byUid.get(uid) || [];
        const byW = new Map<number, WeeklyRule>();
        rulesFor.forEach((r) => byW.set(r.weekday, r));

        let nextSlot: { date: string; time: string } | null = null;
        let modesUnion = new Set<UIMode>();

        for (const r of rulesFor) {
          if (!r?.enabled) continue;
          if (Array.isArray(r.fixtures)) {
            for (const f of r.fixtures) {
              toUIModes(f.modes).forEach((m) => modesUnion.add(m));
            }
          }
        }

        for (let i = 0; i <= horizonDays && !nextSlot; i++) {
          const d = new Date(today);
          d.setUTCDate(today.getUTCDate() + i);
          const dateStr = ymd(d);
          const w = d.getUTCDay();
          const rule = byW.get(w);
          if (
            !rule ||
            !rule.enabled ||
            !Array.isArray(rule.fixtures) ||
            !rule.fixtures.length
          )
            continue;
          const times = Array.from(
            new Set(
              rule.fixtures
                .map((f) => String(f.time))
                .filter((t) => /^\d{2}:\d{2}$/.test(t))
            )
          ).sort((a, b) => a.localeCompare(b));
          if (times.length) {
            nextSlot = { date: dateStr, time: times[0] };
          }
        }

        if (!nextSlot) {
          const now = new Date();
          const todayYmd = ymdUTC(now);
          const nowHM = hmUTC(now);

          const first = await DoctorSlot.findOne({
            userId: doc.userId,
            status: "available",
            $or: [
              { date: { $gt: todayYmd } },
              { date: todayYmd, time: { $gte: nowHM } },
            ],
          })
            .sort({ date: 1, time: 1 })
            .lean()
            .exec();

          if (first) {
            nextSlot = { date: (first as any).date, time: (first as any).time };
            toUIModes((first as any).modes).forEach((m) => modesUnion.add(m));
          }
        }

        return {
          doctorId: doc.doctorId,
          displayName: doc.displayName,
          avatarUrl: doc.avatarUrl,
          experienceYears: doc.experienceYears,
          specialties: doc.specialties,
          consultationFee: doc.consultationFee,
          nextSlot: nextSlot || undefined,
          modes: Array.from(modesUnion),
        };
      })
    );

    return { items: enriched, total, page, limit };
  }

  async getDoctorPublicById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;

    const pipeline: PipelineStage[] = [
      {
        $match: {
          userId: new Types.ObjectId(id),
          "verification.status": "verified",
        },
      },
      {
        $project: {
          doctorId: "$userId",
          displayName: "$profile.displayName",
          avatarUrl: "$profile.avatarUrl",
          experienceYears: "$profile.experienceYears",
          specialties: "$profile.specialties",
          consultationFee: "$profile.consultationFee",
          bio: "$profile.bio",
          languages: "$profile.languages",
          location: "$profile.location",
        },
      },
      { $limit: 1 },
    ];

    const [doc] = await Doctor.aggregate(pipeline).exec();
    if (!doc) return null;

    const rules = await DoctorWeeklyRule.find({
      userId: new Types.ObjectId(id),
    })
      .lean()
      .exec();
    const modesUnion = new Set<UIMode>();
    for (const r of rules) {
      if (!r?.enabled) continue;
      if (Array.isArray(r.fixtures)) {
        for (const f of r.fixtures) {
          toUIModes(f.modes).forEach((m) => modesUnion.add(m));
        }
      }
    }

    return { ...doc, modes: Array.from(modesUnion) as UIMode[] };
  }

  async listGeneratedAvailability(
    id: string,
    opts: GeneratedAvailabilityOptions
  ): Promise<GeneratedSlot[]> {
    if (!Types.ObjectId.isValid(id)) return [];
    const userId = new Types.ObjectId(id);

    const rules = await DoctorWeeklyRule.find({ userId }).lean().exec();
    const byW = new Map<number, WeeklyRule>();
    rules.forEach((r) => byW.set(r.weekday, r as WeeklyRule));

    const out: GeneratedSlot[] = [];
    const startDate = new Date(`${opts.from}T00:00:00Z`);
    const endDate = new Date(`${opts.to}T00:00:00Z`);

    for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
      const ymd = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      const w = d.getUTCDay();
      const r = byW.get(w);
      if (!r || !r.enabled) continue;

      const duration = Number(r.slotLengthMins) || 30;
      if (Array.isArray(r.fixtures) && r.fixtures.length) {
        const seen = new Set<string>();
        for (const f of r.fixtures) {
          const t = String(f.time);
          if (!/^\d{2}:\d{2}$/.test(t)) continue;
          if (seen.has(t)) continue;
          seen.add(t);
          const fee = Number(f.fee) || 0;
          const modes = toUIModes(f.modes);
          out.push({
            _id: `${id}:${ymd}:${t}`,
            date: ymd,
            time: t,
            durationMins: duration,
            fee,
            modes,
            status: "available",
          });
        }
      }
    }

    if (out.length === 0) {
      const rows = await DoctorSlot.find({
        userId,
        date: { $gte: opts.from, $lte: opts.to },
        status: "available",
      })
        .sort({ date: 1, time: 1 })
        .lean()
        .exec();

      return rows.map((s: any) => ({
        _id: String(s._id),
        date: s.date,
        time: s.time,
        durationMins: s.durationMins,
        fee: s.fee ?? 0,
        modes: toUIModes(s.modes),
        status: "available" as const,
      }));
    }

    const booked = await Booking.find({
      doctorId: userId,
      date: { $gte: opts.from, $lte: opts.to },
      status: { $in: ["pending", "paid"] },
    })
      .select({ date: 1, time: 1 })
      .lean()
      .exec();

    const taken = new Set(booked.map((b) => `${b.date}|${b.time}`));
    const filtered = out.filter((s) => !taken.has(`${s.date}|${s.time}`));

    filtered.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    return filtered;
  }
}