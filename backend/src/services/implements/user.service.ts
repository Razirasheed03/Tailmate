// src/services/implements/user.service.ts
import { UserRepository } from '../../repositories/implements/user.repository';
import { PipelineStage, Types } from 'mongoose';
import { DoctorSlot } from '../../schema/doctorSlot.schema';
import { Doctor } from '../../schema/doctor.schema';

export class UserService {
  constructor(private readonly _userRepo = new UserRepository()) {}

  private validateObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid user id');
  }

  private validateUsername(username: string) {
    const val = (username ?? '').trim();
    if (val.length < 3) throw new Error('Username must be at least 3 characters');
    if (val.length > 30) throw new Error('Username is too long');
    // optional: enforce allowed chars
    // if (!/^[a-zA-Z0-9._-]+$/.test(val)) throw new Error('Invalid characters in username');
    return val;
  }

  async updateMyUsername(userId: string, username: string) {
    this.validateObjectId(userId);
    const newUsername = this.validateUsername(username);

    // Use findByIdAndUpdate with runValidators and unique index on username
    const updated = await (this._userRepo as any).model.findByIdAndUpdate(
      userId,
      { $set: { username: newUsername } },
      { new: true, runValidators: true, context: 'query' }
    ).select('-password');

    if (!updated) throw new Error('User not found');
    return updated.toObject();
  }
    async listDoctorsWithNextSlot(params: {
    page?: number;
    limit?: number;
    search?: string;
    specialty?: string;
  }): Promise<{ items: any[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 12));
    const search = (params.search || '').trim();
    const specialty = (params.specialty || '').trim();

    const now = new Date();

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
        $lookup: {
          from: DoctorSlot.collection.name,
          let: { uid: "$userId" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$userId", "$$uid"] }, { $eq: ["$status", "available"] }] } } },
            {
              $addFields: {
                startDateTime: {
                  $dateFromString: { dateString: { $concat: ["$date", "T", "$time", ":00Z"] } },
                },
              },
            },
            { $match: { startDateTime: { $gte: now } } },
            { $sort: { startDateTime: 1 } },
            { $limit: 3 },
            { $project: { _id: 1, date: 1, time: 1, modes: 1, startDateTime: 1 } },
          ],
          as: "upcoming",
        },
      },
      // NEW: keep only doctors who actually have at least one upcoming "available" slot
      { $match: { "upcoming.0": { $exists: true } } },
      {
        $addFields: {
          nextSlot: { $first: "$upcoming" },
          modes: {
            $setUnion: [
              [],
              {
                $reduce: {
                  input: "$upcoming",
                  initialValue: [],
                  in: { $setUnion: ["$$value", "$$this.modes"] },
                },
              },
            ],
          },
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
          isOnline: { $literal: false },
          nextSlot: { date: "$nextSlot.date", time: "$nextSlot.time" },
          modes: 1,
        },
      },
      { $sort: { displayName: 1 } },
      { $facet: { items: [{ $skip: (page - 1) * limit }, { $limit: limit }], total: [{ $count: "count" }] } },
      { $project: { items: 1, total: { $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0] } } },
    ];

    const [result] = await Doctor.aggregate(pipeline).exec();
    return {
      items: result?.items || [],
      total: result?.total || 0,
      page,
      limit,
    };
  }
    async getDoctorPublicById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;

    const now = new Date();
    const pipeline: PipelineStage[] = [
      { $match: { userId: new Types.ObjectId(id), "verification.status": "verified" } },
      {
        $lookup: {
          from: DoctorSlot.collection.name,
          let: { uid: "$userId" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$userId", "$$uid"] }, { $eq: ["$status", "available"] }] } } },
            {
              $addFields: {
                startDateTime: {
                  $dateFromString: { dateString: { $concat: ["$date", "T", "$time", ":00Z"] } },
                },
              },
            },
            { $match: { startDateTime: { $gte: now } } },
            { $sort: { startDateTime: 1 } },
            { $limit: 5 },
            { $project: { modes: 1 } },
          ],
          as: "upcoming",
        },
      },
      {
        $addFields: {
          modes: {
            $setUnion: [
              [],
              {
                $reduce: {
                  input: "$upcoming",
                  initialValue: [],
                  in: { $setUnion: ["$$value", "$$this.modes"] },
                },
              },
            ],
          },
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
          languages: "$profile.languages", // if present in your schema
          location: "$profile.location",   // if present in your schema
          modes: 1,
        },
      },
      { $limit: 1 },
    ];

    const [doc] = await Doctor.aggregate(pipeline).exec();
    return doc || null;
  }

  async listDoctorSlotsBetween(
    id: string,
    opts: { from: string; to: string; status?: "available" | "booked" }
  ) {
    if (!Types.ObjectId.isValid(id)) return [];
    const query: any = {
      userId: new Types.ObjectId(id),
      date: { $gte: opts.from, $lte: opts.to },
    };
    if (opts.status) query.status = opts.status;

    const rows = await DoctorSlot.find(query)
      .sort({ date: 1, time: 1 })
      .lean()
      .exec();

    return rows.map((s: any) => ({
      _id: s._id,
      date: s.date,
      time: s.time,
      durationMins: s.durationMins,
      fee: s.fee ?? 0,
      modes: s.modes || [],
      status: s.status,
    }));
  }
}
  

