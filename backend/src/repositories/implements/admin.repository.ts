// src/repositories/implements/admin.repository.ts
import { Model, Types } from "mongoose";
import { IAdminRepository } from "../interfaces/admin.repository.interface";
import { Doctor } from "../../schema/doctor.schema";

export class AdminRepository implements IAdminRepository {
  constructor(private readonly doctorModel: Model<any> = Doctor) {}

  async listDoctors(params: { page: number; limit: number; status?: string; search?: string }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 10));
    const skip = (page - 1) * limit;
    const status = params.status || "";
    const search = (params.search || "").trim();

    const match: Record<string, any> = {};
    if (status) match["verification.status"] = status;

    const pipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "user.username": { $regex: search, $options: "i" } },
            { "user.email": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    const countPipeline = [...pipeline, { $count: "count" }];

    pipeline.push(
      { $sort: { "verification.submittedAt": -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          userId: "$userId",
          username: "$user.username",
          email: "$user.email",
          status: "$verification.status",
          certificateUrl: "$verification.certificateUrl",
          submittedAt: "$verification.submittedAt",
        },
      }
    );

    const [data, countDoc] = await Promise.all([
      this.doctorModel.aggregate(pipeline),
      this.doctorModel.aggregate(countPipeline),
    ]);

    const total = countDoc?.[0]?.count || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { data, page, totalPages, total };
  }

  async verifyDoctor(userId: string, reviewerId: string) {
    const now = new Date();
    const updated = await this.doctorModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        $set: {
          "verification.status": "verified",
          "verification.verifiedAt": now,
          "verification.reviewedBy": new Types.ObjectId(reviewerId),
        },
      },
      { new: true }
    );
    if (!updated) throw new Error("Doctor not found");
    return updated;
  }

  async rejectDoctor(userId: string, reviewerId: string, reasons: string[]) {
    const updated = await this.doctorModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        $set: {
          "verification.status": "rejected",
          "verification.reviewedBy": new Types.ObjectId(reviewerId),
          "verification.rejectionReasons": reasons || [],
        },
      },
      { new: true }
    );
    if (!updated) throw new Error("Doctor not found");
    return updated;
  }
  async getDoctorDetail(userId: string) {
  const _id = new Types.ObjectId(userId);

  const pipeline: any[] = [
    { $match: { userId: _id } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        userId: "$userId",
        username: "$user.username",
        email: "$user.email",
        status: "$verification.status",
        certificateUrl: "$verification.certificateUrl",
        submittedAt: "$verification.submittedAt",
        verifiedAt: "$verification.verifiedAt",
        rejectionReasons: "$verification.rejectionReasons",
        displayName: "$profile.displayName",
        bio: "$profile.bio",
        specialties: "$profile.specialties",
        experienceYears: "$profile.experienceYears",
        licenseNumber: "$profile.licenseNumber",
        avatarUrl: "$profile.avatarUrl",
        consultationFee: "$profile.consultationFee",
      },
    },
  ];

  const res = await this.doctorModel.aggregate(pipeline);
  if (!res?.length) throw new Error("Doctor not found");
  return res[0];
}

}
