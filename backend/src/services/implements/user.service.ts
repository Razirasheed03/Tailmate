// backend/src/services/implements/user.service.ts
import { Types } from "mongoose";
import { UserRepository } from "../../repositories/implements/user.repository";
import { DoctorPublicRepository } from "../../repositories/implements/doctorPublic.repository";
import { BookingRepository } from "../../repositories/implements/booking.repository";
import { UIMode } from "../interfaces/checkout.service.interface";
import { PaymentModel } from "../../models/implements/payment.model";
import { stripe } from "../../utils/stripe";
import { Wallet } from "../../schema/wallet.schema";

export type PublicDoctor = any;
export type PublicDoctorWithNextSlot = any;
export type PaginatedDoctors = {
  items: PublicDoctorWithNextSlot[];
  total: number;
  page: number;
  limit: number;
};

export class UserService {
  constructor(
    private readonly _userRepo = new UserRepository(),
    private readonly _doctorPubRepo = new DoctorPublicRepository(),
    private readonly _bookingRepo= new BookingRepository()
  ) {}

  private validateObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) throw new Error("Invalid user id");
  }

  private validateUsername(username: string): string {
    const val = (username ?? "").trim();
    if (val.length < 3) throw new Error("Username must be at least 3 characters");
    if (val.length > 30) throw new Error("Username is too long");
    return val;
  }

  async updateMyUsername(userId: string, username: string): Promise<any> {
    // Replace any with repository's updated user DTO
    this.validateObjectId(userId);
    const newUsername = this.validateUsername(username);
    const updated = await this._userRepo.updateUsername(userId, newUsername);
    if (!updated) throw new Error("User not found");
    return updated;
  }

  async listDoctorsWithNextSlot(params: {
    page?: number;
    limit?: number;
    search?: string;
    specialty?: string;
  }): Promise<PaginatedDoctors> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 12));
    const search = (params.search || "").trim();
    const specialty = (params.specialty || "").trim();
    return this._doctorPubRepo.listVerifiedWithNextSlot({ page, limit, search, specialty });
  }

  async getDoctorPublicById(id: string): Promise<PublicDoctor | null> {
    return this._doctorPubRepo.getDoctorPublicById(id);
  }

  async listDoctorGeneratedAvailability(
    id: string,
    opts: { from: string; to: string }
  ): Promise<
    Array<{
      date: string;
      time: string;
      durationMins: number;
      modes: string[]; // or a refined union if repo guarantees
      fee?: number;
    }>
  > {
    return this._doctorPubRepo.listGeneratedAvailability(id, opts);
  }
  async listMyBookings(userId: string, params: {
    page: number;
    limit: number;
    scope: "upcoming" | "today" | "past" | "all";
    status?: string;
    mode?: UIMode;
    q?: string;
  }): Promise<{ items: any[]; total: number }> {
    this.validateObjectId(userId);
    
    const page = Math.max(1, params.page);
    const limit = Math.min(50, Math.max(1, params.limit));

    return this._bookingRepo.listUserBookings({
      userId,
      page,
      limit,
      scope: params.scope,
      status: params.status,
      mode: params.mode,
      q: params.q,
    });
  }

  async getMyBookingById(userId: string, bookingId: string): Promise<any | null> {
    this.validateObjectId(userId);
    if (!Types.ObjectId.isValid(bookingId)) throw new Error("Invalid booking id");
    
    return this._bookingRepo.getUserBookingById(userId, bookingId);
  }

async cancelMyBooking(userId: string, bookingId: string): Promise<{ success: boolean; message?: string }> {
  this.validateObjectId(userId);
  if (!Types.ObjectId.isValid(bookingId)) throw new Error("Invalid booking id");

  // Cancel in repository, status: 'cancelled'
  const cancelled = await this._bookingRepo.cancelUserBooking(userId, bookingId);

  if (!cancelled) {
    return { success: false, message: "Booking not found or cannot be cancelled" };
  }

  // === Find corresponding successful payment and process refund ===
  // Find payment for booking
  const payment = await PaymentModel.findOne({
    bookingId: cancelled._id,
    paymentStatus: "success"
  }).lean();

  if (!payment) {
    return { success: true, message: "Booking cancelled but payment not found or not successful, no refund issued." };
  }

  // Refund in Stripe
  let stripeRefund;
  try {
    if (payment.paymentIntentId) {
      stripeRefund = await stripe.refunds.create({
        payment_intent: payment.paymentIntentId,
        reason: "requested_by_customer",
      });
    }
  } catch (err) {
    console.error("Stripe refund error:", err);
    return { success: true, message: "Booking cancelled but Stripe refund failed. Please contact support." };
  }

  // === Update wallets ===
  const { amount, platformFee, doctorEarning, currency } = payment;

  const currencyCode = (currency || "INR").toUpperCase();

  // Decrement doctor wallet
  await Wallet.updateOne(
    { ownerType: "doctor", ownerId: payment.doctorId, currency: currencyCode },
    { $inc: { balanceMinor: -Math.round(doctorEarning * 100) } }
  );

  // Decrement admin wallet
  await Wallet.updateOne(
    { ownerType: "admin", currency: currencyCode },
    { $inc: { balanceMinor: -Math.round(platformFee * 100) } }
  );

  // Credit user wallet
  await Wallet.updateOne(
    { ownerType: "user", ownerId: payment.patientId, currency: currencyCode },
    { $inc: { balanceMinor: Math.round(amount * 100) } },
    { upsert: true }
  );

  // Optionally, mark booking as 'refunded'
  await this._bookingRepo.updateBookingStatus(bookingId, "refunded");

  // Optionally, update payment status
  await PaymentModel.findByIdAndUpdate(payment._id, { paymentStatus: "failed" }); // or make a new field: "refunded"

  return {
    success: true,
    message: "Booking cancelled and refunded successfully."
  };
}
}
