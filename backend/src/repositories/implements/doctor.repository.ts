// backend/src/repositories/implements/doctor.repository.ts
import mongoose, { Model, PipelineStage, Types } from "mongoose";
import { DoctorModel } from "../../models/implements/doctor.model";
import { IDoctorRepository } from "../interfaces/doctor.repository.interface";
import { Booking } from "../../schema/booking.schema";
import { IDoctorModel, IDoctorVerification, IDoctorProfile, UpdateProfileDTO } from "../../models/interfaces/doctor.model.interface";
import { UserModel } from "../../models/implements/user.model";
import { PaymentModel } from "../../models/implements/payment.model";

export class DoctorRepository implements IDoctorRepository {
  constructor(private readonly model: Model<any> = DoctorModel) {}

 async createIfMissing(userId: string): Promise<IDoctorModel> {
    let doc = await this.model.findOne({ userId });
    if (!doc) {
      doc = await this.model.create({ 
        userId, 
        verification: { 
          status: "not_submitted",
          certificateUrl: undefined,
          submittedAt: undefined,
          rejectionReasons: []
        } 
      });
    }
    return doc;
  }

  async getVerification(userId: string): Promise<IDoctorVerification> {
    const doc = await this.model.findOne({ userId }).select("verification");
    if (!doc) {
      return { 
        status: "not_submitted", 
        certificateUrl: undefined, 
        rejectionReasons: [] 
      };
    }
    return doc.verification;
  }

  async submitCertificate(userId: string, certificateUrl: string): Promise<IDoctorModel> {
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

  async getProfile(userId: string): Promise<IDoctorProfile> {
    const doc = await this.model.findOne({ userId }).select("profile");
    if (!doc) return {};
    return doc.profile || {};
  }

  async updateProfile(userId: string, profile: Partial<UpdateProfileDTO>): Promise<IDoctorProfile> {
    const $set: Record<string, unknown> = {};
    
    if (typeof profile.displayName === "string") {
      $set["profile.displayName"] = profile.displayName;
    }
    if (typeof profile.bio === "string") {
      $set["profile.bio"] = profile.bio;
    }
    if (Array.isArray(profile.specialties)) {
      $set["profile.specialties"] = profile.specialties;
    }
    if (typeof profile.experienceYears === "number") {
      $set["profile.experienceYears"] = profile.experienceYears;
    }
    if (typeof profile.licenseNumber === "string") {
      $set["profile.licenseNumber"] = profile.licenseNumber;
    }
    if (typeof profile.avatarUrl === "string") {
      $set["profile.avatarUrl"] = profile.avatarUrl;
    }
    if (typeof profile.consultationFee === "number") {
      $set["profile.consultationFee"] = profile.consultationFee;
    }

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

  async saveCertificateUrl(userId: string, certificateUrl: string): Promise<IDoctorVerification> {
    const doc = await this.model.findOne({ userId });
    if (!doc) throw new Error("Doctor not found");
    
    doc.verification.certificateUrl = certificateUrl;
    await doc.save();
    
    return doc.verification;
  }

  async submitForReview(userId: string): Promise<IDoctorModel> {
    const doc = await this.model.findOne({ userId });
    if (!doc) throw new Error("Doctor not found");
    
    doc.verification.status = "pending";
    doc.verification.submittedAt = new Date();
    doc.verification.rejectionReasons = [];
    await doc.save();
    
    return doc;
  }
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
  }

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
  } 
  async doctorDashboard(doctorId: string): Promise<any | null> {
    const totalBookings=await Booking.countDocuments({doctorId})
    const totalEarningsAgg=await PaymentModel.aggregate([
      {$match:{doctorId,paymentStatus:"Success"}},
      {$group:{_id:null,sum:{$sum:"$doctorEarning"}}}
    ])
      const totalEarnings = totalEarningsAgg[0]?.sum || 0;
      return {totalBookings,totalEarnings}
  }
  async getBookingStatusCounts(doctorId: string) {
  const id = new Types.ObjectId(doctorId);

  const result = await Booking.aggregate([
    { $match: { doctorId: id } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Initialize default structure
  const counts = {
    pending: 0,
    completed: 0,
    cancelled: 0,
  };

  // Map Mongo results to our structure
  result.forEach((item: any) => {
    if (item._id === "pending") counts.pending = item.count;
    if (item._id === "paid") counts.completed = item.count;
    if (item._id === "cancelled") counts.cancelled = item.count;
  });

  return counts;
}
 async getDashboardStats(doctorId: string) {
    const doctorObjId = new mongoose.Types.ObjectId(doctorId);

    // TODAY date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // -----------------------------
    // 1. Appointments Today
    // -----------------------------
    const appointmentsToday = await Booking.countDocuments({
      doctorId: doctorObjId,
      date: todayStart.toISOString().split("T")[0],
      status: { $in: ["pending", "paid"] }
    });

    // -----------------------------
    // 2. Unique Patients Count
    // -----------------------------
    const patientsResult = await Booking.aggregate([
      { $match: { doctorId: doctorObjId, status: "paid" } },
      { $group: { _id: "$patientId" } }
    ]);
    const totalPatients = patientsResult.length;

    // -----------------------------
    // 3. Earnings This Month
    // -----------------------------
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const earningsMonthResult = await PaymentModel.aggregate([
      { 
        $match: { 
          doctorId: doctorObjId, 
          paymentStatus: "success",
          createdAt: { $gte: monthStart }
        }
      },
      { $group: { _id: null, total: { $sum: "$doctorEarning" } } }
    ]);

    const earningsThisMonth = earningsMonthResult[0]?.total || 0;

    // -----------------------------
    // 4. Earnings Last 6 Months Graph
    // -----------------------------
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); 

    const graphData = await PaymentModel.aggregate([
      { 
        $match: { 
          doctorId: doctorObjId, 
          paymentStatus: "success",
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          total: { $sum: "$doctorEarning" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const months = graphData.map(e => 
      new Date(e._id.year, e._id.month - 1).toLocaleString("en-US", { month: "short" })
    );

    const earnings = graphData.map(e => e.total);

    return {
      appointmentsToday,
      totalPatients,
      earningsThisMonth,
      chart: {
        months,
        earnings
      }
    };
  }
 async getDoctorBookingTrends(doctorId: string) {
    return await Booking.aggregate([
      { $match: { doctorId: new mongoose.Types.ObjectId(doctorId), status: "paid" } },

      {
        $lookup: {
          from: "pets",
          localField: "petName",   // your Booking stores petName, not petId
          foreignField: "name",    // match by pet name
          as: "petData"
        }
      },

      { $unwind: "$petData" },

      {
        $group: {
          _id: "$petData.speciesCategoryName",
          count: { $sum: 1 }
        }
      },

      { $sort: { count: -1 } },

      {
        $project: {
          _id: 0,
          categoryName: "$_id",
          count: 1
        }
      }
    ]);
  }
  
}
