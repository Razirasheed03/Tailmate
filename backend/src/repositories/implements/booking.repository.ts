// backend/src/repositories/implements/booking.repository.ts
import { Model, Types } from "mongoose";
import { Booking, type BookingAttrs, type BookingLean } from "../../schema/booking.schema";

export class BookingRepository {
  constructor(private readonly model: Model<BookingAttrs> = Booking) {}

  async create(attrs: {
    patientId: string;
    doctorId: string;
    slotId?: string | null;
    date: string;
    time: string;
    durationMins: number;
    mode: "video" | "audio" | "inPerson";
    amount: number;
    currency: string;
    petName: string;
    notes?: string;
    paymentMethod: "card" | "wallet";
    paymentProvider?: string;
    paymentSessionId?: string;
    paymentRedirectUrl?: string;
  }): Promise<BookingLean> {
    const doc = await this.model.create({
      patientId: new Types.ObjectId(attrs.patientId),
      doctorId: new Types.ObjectId(attrs.doctorId),
      slotId: attrs.slotId ? new Types.ObjectId(attrs.slotId) : null,
      date: attrs.date,
      time: attrs.time,
      durationMins: attrs.durationMins,
      mode: attrs.mode,
      amount: attrs.amount,
      currency: attrs.currency,
      petName: attrs.petName,
      notes: attrs.notes ?? "",
      paymentMethod: attrs.paymentMethod,
      status: "pending",
      paymentProvider: attrs.paymentProvider ?? "",
      paymentSessionId: attrs.paymentSessionId ?? "",
      paymentRedirectUrl: attrs.paymentRedirectUrl ?? "",
    });
    return doc.toObject() as BookingLean;
  }

  async markPaid(bookingId: string, sessionId?: string): Promise<BookingLean | null> {
    if (!Types.ObjectId.isValid(bookingId)) return null;
    const _id = new Types.ObjectId(bookingId);
    const updated = await this.model
      .findOneAndUpdate(
        { _id, status: "pending" },
        { $set: { status: "paid", paymentSessionId: sessionId ?? "" } },
        { new: true }
      )
      .lean<BookingLean>() // enforce lean shape
      .exec();
    return updated ?? null;
  }

  async updateStatus(
    bookingId: string,
    status: "pending" | "paid" | "cancelled" | "failed" | "refunded"
  ): Promise<BookingLean | null> {
    if (!Types.ObjectId.isValid(bookingId)) return null;
    const _id = new Types.ObjectId(bookingId);
    const updated = await this.model
      .findByIdAndUpdate(_id, { $set: { status } }, { new: true })
      .lean<BookingLean>() // enforce lean shape
      .exec();
    return updated ?? null;
  }

  async findById(bookingId: string): Promise<BookingLean | null> {
    if (!Types.ObjectId.isValid(bookingId)) return null;
    const _id = new Types.ObjectId(bookingId);
    const row = await this.model.findById(_id, null, { lean: true }).exec();
    return (row as unknown as BookingLean | null) ?? null;
  }
   async listUserBookings(params: {
    userId: string;
    page: number;
    limit: number;
    scope: "upcoming" | "today" | "past" | "all";
    status?: string;
    mode?: string;
    q?: string;
  }): Promise<{ items: any[]; total: number }> {
    if (!Types.ObjectId.isValid(params.userId)) {
      return { items: [], total: 0 };
    }

    const patientId = new Types.ObjectId(params.userId);
    const skip = (params.page - 1) * params.limit;

    // Build date filter based on scope
    const today = new Date().toISOString().split("T")[0];
    const dateFilter: any = {};

    switch (params.scope) {
      case "today":
        dateFilter.date = today;
        break;
      case "upcoming":
        dateFilter.date = { $gte: today };
        break;
      case "past":
        dateFilter.date = { $lt: today };
        break;
      case "all":
      default:
        // no date filter
        break;
    }

    // Build query
    const query: any = { patientId, ...dateFilter };

    if (params.status) {
      query.status = params.status;
    }

    if (params.mode) {
      query.mode = params.mode;
    }

    // Search filter (pet name or notes)
    if (params.q && params.q.trim()) {
      query.$or = [
        { petName: { $regex: params.q.trim(), $options: "i" } },
        { notes: { $regex: params.q.trim(), $options: "i" } },
      ];
    }

    // Execute query with doctor info population
    const items = await this.model
      .find(query)
      .populate({
        path: "doctorId",
        select: "username email profile.specialty profile.profilePic",
      })
      .sort({ date: -1, time: -1 })
      .skip(skip)
      .limit(params.limit)
      .lean()
      .exec();

    const total = await this.model.countDocuments(query).exec();

    // Transform results to include doctor details
    const transformed = items.map((item: any) => {
      const doctor = item.doctorId || {};
      return {
        _id: item._id.toString(),
        patientId: item.patientId.toString(),
        doctorId: typeof item.doctorId === "object" ? item.doctorId._id.toString() : item.doctorId.toString(),
        doctorName: doctor.username || "Unknown Doctor",
        doctorSpecialty: doctor.profile?.specialty || "",
        doctorProfilePic: doctor.profile?.profilePic || "",
        slotId: item.slotId ? item.slotId.toString() : null,
        date: item.date,
        time: item.time,
        durationMins: item.durationMins,
        mode: item.mode,
        amount: item.amount,
        currency: item.currency,
        petName: item.petName,
        notes: item.notes || "",
        paymentMethod: item.paymentMethod,
        status: item.status,
        paymentProvider: item.paymentProvider || "",
        paymentSessionId: item.paymentSessionId || "",
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    return { items: transformed, total };
  }

  // /**
  //  * Get a single user booking by ID with doctor details
  //  */
  async getUserBookingById(
    userId: string,
    bookingId: string
  ): Promise<any | null> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(bookingId)) {
      return null;
    }

    const patientId = new Types.ObjectId(userId);
    const _id = new Types.ObjectId(bookingId);

    const item = await this.model
      .findOne({ _id, patientId })
      .populate({
        path: "doctorId",
        select: "username email profile.specialty profile.profilePic",
      })
      .lean()
      .exec();

    if (!item) return null;

    const doctor = (item as any).doctorId || {};
    return {
      _id: item._id.toString(),
      patientId: item.patientId.toString(),
      doctorId: typeof (item as any).doctorId === "object" ? (item as any).doctorId._id.toString() : (item as any).doctorId.toString(),
      doctorName: doctor.username || "Unknown Doctor",
      doctorSpecialty: doctor.profile?.specialty || "",
      doctorProfilePic: doctor.profile?.profilePic || "",
      slotId: item.slotId ? item.slotId.toString() : null,
      date: item.date,
      time: item.time,
      durationMins: item.durationMins,
      mode: item.mode,
      amount: item.amount,
      currency: item.currency,
      petName: item.petName,
      notes: item.notes || "",
      paymentMethod: item.paymentMethod,
      status: item.status,
      paymentProvider: item.paymentProvider || "",
      paymentSessionId: item.paymentSessionId || "",
      createdAt: (item as any).createdAt,
      updatedAt: (item as any).updatedAt,
    };
  }

  /**
   * Cancel a user booking (only if status is 'paid')
   */
  async cancelUserBooking(
    userId: string,
    bookingId: string
  ): Promise<BookingLean | null> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(bookingId)) {
      return null;
    }

    const patientId = new Types.ObjectId(userId);
    const _id = new Types.ObjectId(bookingId);

    const updated = await this.model
      .findOneAndUpdate(
        { _id, patientId, status: "paid" },
        { $set: { status: "cancelled" } },
        { new: true }
      )
      .lean<BookingLean>()
      .exec();

    return updated ?? null;
  }
  async updateBookingStatus(bookingId: string, newStatus: string) {
  if (!Types.ObjectId.isValid(bookingId)) return null;
  return await this.model.findByIdAndUpdate(
    bookingId,
    { $set: { status: newStatus } },
    { new: true }
  ).lean();
}
}

