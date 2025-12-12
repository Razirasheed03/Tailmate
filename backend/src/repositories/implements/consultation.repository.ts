//consultation.repository.ts
import { Model, Types } from "mongoose";
import { Consultation } from "../../schema/consultation.schema";

export class ConsultationRepository {
  model: Model<any>;
  
  constructor(model: Model<any> = Consultation) {
    this.model = model;
  }

  /**
   * Populate consultation with user and doctor details
   * userId: User document
   * doctorId: Doctor document with nested userId (User document)
   */
  private populate(query: any) {
    return query
      .populate("userId", "_id username email")
      .populate({
        path: "doctorId",
        model: "Doctor",
        populate: { 
          path: "userId", 
          model: "User",
          select: "_id username email" 
        }
      });
  }

  async create(userId: string, doctorProfileId: string, body: any) {
    const doc = await this.model.create({
      userId: new Types.ObjectId(userId),
      doctorId: new Types.ObjectId(doctorProfileId),
      scheduledFor: body.scheduledFor,
      durationMinutes: body.durationMinutes || 30,
      notes: body.notes || null,
    });
    return doc.toObject();
  }

  async findById(id: string) {
    const doc = await this.populate(this.model.findById(id));
    if (!doc) return null;
    
    const obj = doc.toObject();
    console.log("[findById] Populated consultation:", {
      _id: obj._id,
      userId: obj.userId,
      doctorId: obj.doctorId,
    });
    
    return obj;
  }

  async findByIdAndUpdate(id: string, updates: any) {
    const doc = await this.populate(
      this.model.findByIdAndUpdate(id, updates, { new: true })
    );
    return doc ? doc.toObject() : null;
  }

  async findByVideoRoomId(videoRoomId: string) {
    const doc = await this.populate(this.model.findOne({ videoRoomId }));
    return doc ? doc.toObject() : null;
  }

  async listUserConsultations(userId: string, status?: string) {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (status) filter.status = status;
    const docs = await this.populate(
      this.model.find(filter).sort({ scheduledFor: -1 })
    );
    return docs.map((d: any) => d.toObject());
  }

  async listDoctorConsultations(doctorProfileId: string, status?: string) {
    const filter: any = { doctorId: new Types.ObjectId(doctorProfileId) };
    if (status) filter.status = status;
    const docs = await this.populate(
      this.model.find(filter).sort({ scheduledFor: -1 })
    );
    return docs.map((d: any) => d.toObject());
  }

  async findUpcomingConsultations(minutesBefore: number = 5) {
    const now = new Date();
    const futureTime = new Date(now.getTime() + minutesBefore * 60000);
    const docs = await this.populate(
      this.model.find({
        status: "upcoming",
        scheduledFor: { $lte: futureTime, $gte: now },
        videoRoomId: null,
      })
    );
    return docs.map((d: any) => d.toObject());
  }

  async findActiveConsultations(consultationId: string) {
    const doc = await this.populate(
      this.model.findOne({
        _id: new Types.ObjectId(consultationId),
        status: { $in: ["upcoming", "in_progress"] },
      })
    );
    return doc ? doc.toObject() : null;
  }

  async cancel(id: string, cancelledBy: string, reason: string) {
    const doc = await this.populate(
      this.model.findByIdAndUpdate(
        id,
        {
          status: "cancelled",
          cancelledBy: new Types.ObjectId(cancelledBy),
          cancelledAt: new Date(),
          cancellationReason: reason,
        },
        { new: true }
      )
    );
    return doc ? doc.toObject() : null;
  }
}
