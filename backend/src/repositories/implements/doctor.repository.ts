// backend/src/repositories/implements/doctor.repository.ts
import { Model, PipelineStage, Types } from "mongoose";
import { DoctorModel } from "../../models/implements/doctor.model";
import { IDoctorRepository } from "../interfaces/doctor.repository.interface";
import { Booking } from "../../schema/booking.schema";
import { UserModel } from "../../models/implements/user.model";

export class DoctorRepository implements IDoctorRepository {
  constructor(private readonly model: Model<any> = DoctorModel) {}

  async createIfMissing(userId: string) {
    let doc = await this.model.findOne({ userId });
    if (!doc) {
      doc = await this.model.create({ userId, verification: { status: "pending" } });
    }
    return doc;
  } // basic ensure doc row [web:507]

  async getVerification(userId: string) {
    const doc = await this.model.findOne({ userId }).select("verification");
    if (!doc) return { status: "pending", rejectionReasons: [] };
    return doc.verification;
  } // simple read [web:507]

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
  } // state transition to pending [web:507]

  async getProfile(userId: string) {
    const doc = await this.model.findOne({ userId }).select("profile");
    if (!doc) return {};
    return doc.profile || {};
  } // profile fetch [web:507]

  async updateProfile(userId: string, profile: Partial<any>) {
    const $set: Record<string, any> = {};
    if (typeof profile.displayName === "string") $set["profile.displayName"] = profile.displayName;
    if (typeof profile.bio === "string") $set["profile.bio"] = profile.bio;
    if (Array.isArray(profile.specialties)) $set["profile.specialties"] = profile.specialties;
    if (typeof profile.experienceYears === "number") $set["profile.experienceYears"] = profile.experienceYears;
    if (typeof profile.licenseNumber === "string") $set["profile.licenseNumber"] = profile.licenseNumber;
    if (typeof profile.avatarUrl === "string") $set["profile.avatarUrl"] = profile.avatarUrl;
    if (typeof profile.consultationFee === "number") $set["profile.consultationFee"] = profile.consultationFee;

    if (Object.keys($set).length === 0) {
      const doc = await this.model.findOne({ userId }).select("profile");
      if (!doc) throw new Error("Doctor not found");
      return doc.profile || {};
    }
    const updated = await this.model.findOneAndUpdate({ userId }, { $set }, { new: true, upsert: true }).select("profile");
    if (!updated) throw new Error("Doctor not found");
    return updated.profile || {};
  } // profile update with selective $set [web:507]

  // ===== NEW: Sessions (bookings) aggregation =====

  async listSessions(
    doctorId: string,
    opts: { page: number; limit: number; scope: "upcoming" | "today" | "past"; mode?: "video" | "audio" | "inPerson"; q?: string }
  ): Promise<{ items: any[]; total: number }> {
    const page = Math.max(1, Number(opts.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(opts.limit) || 10));

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const baseMatch = { doctorId: new Types.ObjectId(doctorId) };

    const addStartDT: PipelineStage.AddFields = {
      $addFields: {
        startDT: { $dateFromString: { dateString: { $concat: ["$date", "T", "$time", ":00Z"] } } },
      },
    };

    const scopeMatch =
      opts.scope === "today"
        ? { startDT: { $gte: startOfDay, $lte: endOfDay } }
        : opts.scope === "past"
        ? { startDT: { $lt: now } }
        : { startDT: { $gte: now } };

    const qRegex = opts.q ? { $regex: opts.q, $options: "i" } : null;

    const pipeline: PipelineStage[] = [
      { $match: baseMatch },
      addStartDT,
      { $match: scopeMatch },
      ...(opts.mode ? [{ $match: { mode: opts.mode } as any }] : []),
      {
        $lookup: {
          from: UserModel.collection.name,
          localField: "patientId",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
      ...(qRegex
        ? [{ $match: { $or: [{ petName: qRegex }, { "patient.username": qRegex }, { "patient.email": qRegex }] } }]
        : []),
      {
        $project: {
          _id: 1,
          date: 1,
          time: 1,
          durationMins: 1,
          mode: 1,
          status: 1,
          petName: 1,
          notes: 1,
          patientId: 1,
          patientName: "$patient.username",
          patientEmail: "$patient.email",
          doctorId: 1,
          slotId: 1,
          amount: 1,
          currency: 1,
          startDT: 1,
        },
      },
      { $sort: { startDT: 1 } },
      {
        $facet: {
          items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          total: [{ $count: "count" }],
        },
      },
      { $project: { items: 1, total: { $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0] } } },
    ];

    const [r] = await Booking.aggregate(pipeline).exec();
    return { items: r?.items || [], total: r?.total || 0 };
  } // pagination via $facet and date parsing via $dateFromString [web:523][web:358]

  async getSession(doctorId: string, bookingId: string): Promise<any | null> {
    if (!Types.ObjectId.isValid(bookingId)) return null;

    const rows = await Booking.aggregate([
      { $match: { _id: new Types.ObjectId(bookingId), doctorId: new Types.ObjectId(doctorId) } },
      {
        $lookup: {
          from: UserModel.collection.name,
          localField: "patientId",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          date: 1,
          time: 1,
          durationMins: 1,
          mode: 1,
          status: 1,
          petName: 1,
          notes: 1,
          patientId: 1,
          patientName: "$patient.username",
          patientEmail: "$patient.email",
          amount: 1,
          currency: 1,
          doctorId: 1,
          slotId: 1,
          createdAt: 1,
        },
      },
      { $limit: 1 },
    ]).exec();

    return rows?.[0] || null;
  } // single row with $lookup join to patient [web:192]
}
