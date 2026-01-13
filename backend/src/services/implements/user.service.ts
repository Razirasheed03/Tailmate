// backend/src/services/implements/user.service.ts
import { Types } from "mongoose";
import { IUserRepository } from "../../repositories/interfaces/user.repository.interface";
import { IDoctorPublicRepository } from "../../repositories/interfaces/doctorPublic.repository.interface";
import { IBookingRepository } from "../../repositories/interfaces/booking.repository.interface";
import { IUserService } from "../interfaces/user.service.interface";
import { UIMode } from "../interfaces/checkout.service.interface";
import { PaymentModel } from "../../models/implements/payment.model";
import { stripe } from "../../utils/stripe";
import { Wallet } from "../../schema/wallet.schema";
import mongoose from "mongoose";
import { WalletHistory } from "../../schema/walletHistory.schema";
import { NotificationModel } from "../../schema/notification.schema";
import { io } from "../../server";

export type PublicDoctor = any;
export type PublicDoctorWithNextSlot = any;
export type PaginatedDoctors = {
  items: PublicDoctorWithNextSlot[];
  total: number;
  page: number;
  limit: number;
};

export class UserService implements IUserService {
  constructor(
    private readonly _userRepo: IUserRepository,
    private readonly _doctorPubRepo: IDoctorPublicRepository,
    private readonly _bookingRepo: IBookingRepository
  ) {}

  private validateObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) throw new Error("Invalid user id");
  }

  private validateUsername(username: string): string {
    const val = (username ?? "").trim();
    if (val.length < 3)
      throw new Error("Username must be at least 3 characters");
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
    return this._doctorPubRepo.listVerifiedWithNextSlot({
      page,
      limit,
      search,
      specialty,
    });
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
  async listMyBookings(
    userId: string,
    params: {
      page: number;
      limit: number;
      scope: "upcoming" | "today" | "past" | "all";
      status?: string;
      mode?: UIMode;
      q?: string;
      
    }
  ): Promise<{ items: any[]; total: number }> {
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

  async getMyBookingById(
    userId: string,
    bookingId: string
  ): Promise<any | null> {
    this.validateObjectId(userId);
    if (!Types.ObjectId.isValid(bookingId))
      throw new Error("Invalid booking id");

    return this._bookingRepo.getUserBookingById(userId, bookingId);
  }

  async cancelMyBooking(
    userId: string,
    bookingId: string
  ): Promise<{ success: boolean; message?: string }> {
    this.validateObjectId(userId);
    if (!Types.ObjectId.isValid(bookingId))
      throw new Error("Invalid booking id");

    // Cancel in repository, status: 'cancelled'
    const cancelled = await this._bookingRepo.cancelUserBooking(
      userId,
      bookingId
    );

    if (!cancelled) {
      const existing = await this._bookingRepo.findById(bookingId);
      if (
        existing &&
        String(existing.patientId) === String(userId) &&
        (existing.status === "cancelled" || existing.status === "refunded")
      ) {
        return { success: true, message: "Booking cancelled successfully." };
      }

      return { success: false, message: "Booking not found or cannot be cancelled" };
    }
    const payment = await PaymentModel.findOne({
      bookingId: cancelled._id,
      paymentStatus: "success",
    }).lean();

    if (!payment) {
      return {
        success: true,
        message:
          "Booking cancelled but payment not found or not successful, no refund issued.",
      };
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
      return {
        success: true,
        message:
          "Booking cancelled but Stripe refund failed. Please contact support.",
      };
    }

    // === Update wallets + mark refunded atomically (DB transaction) ===
    const currencyCode = (payment.currency || "INR").toUpperCase();
    const amountMinor = Math.round(Number(payment.amount || 0) * 100);
    const doctorDeductMinor = Math.round(Number(payment.doctorEarning || 0) * 100);
    const adminDeductMinor = Math.round(Number(payment.platformFee || 0) * 100);

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const walletCreditGate = await PaymentModel.updateOne(
          { _id: payment._id, paymentStatus: "success", walletCredited: { $ne: true } },
          { $set: { walletCredited: true, walletCreditedAt: new Date() } },
          { session }
        );

        if (walletCreditGate.modifiedCount === 1) {
          if (doctorDeductMinor > 0) {
            await Wallet.updateOne(
              { ownerType: "doctor", ownerId: payment.doctorId, currency: currencyCode },
              { $inc: { balanceMinor: doctorDeductMinor } },
              { upsert: true, session }
            );
          }

          if (adminDeductMinor > 0) {
            await Wallet.updateOne(
              { ownerType: "admin", currency: currencyCode },
              { $inc: { balanceMinor: adminDeductMinor } },
              { upsert: true, session }
            );
          }
        }

        const refundUpdate = await PaymentModel.updateOne(
          { _id: payment._id, paymentStatus: "success" },
          { $set: { paymentStatus: "refunded" } },
          { session }
        );

        // Idempotency: only apply wallet movements + history once
        if (refundUpdate.modifiedCount === 1) {
          await Wallet.updateOne(
            { ownerType: "user", ownerId: payment.patientId, currency: currencyCode },
            { $inc: { balanceMinor: amountMinor } },
            { upsert: true, session }
          );

          const doctorDebit = await Wallet.updateOne(
            {
              ownerType: "doctor",
              ownerId: payment.doctorId,
              currency: currencyCode,
              balanceMinor: { $gte: doctorDeductMinor },
            },
            { $inc: { balanceMinor: -doctorDeductMinor } },
            { session }
          );

          if (doctorDebit.modifiedCount !== 1) {
            throw Object.assign(new Error("Insufficient doctor wallet balance"), { status: 400 });
          }

          const adminDebit = await Wallet.updateOne(
            {
              ownerType: "admin",
              currency: currencyCode,
              balanceMinor: { $gte: adminDeductMinor },
            },
            { $inc: { balanceMinor: -adminDeductMinor } },
            { session }
          );

          if (adminDebit.modifiedCount !== 1) {
            throw Object.assign(new Error("Insufficient admin wallet balance"), { status: 400 });
          }

          await WalletHistory.create(
            [
              {
                ownerType: "user",
                ownerId: payment.patientId as any,
                currency: currencyCode,
                amountMinor,
                direction: "credit",
                type: "CONSULTATION_CANCEL_REFUND",
                referenceId: payment._id as any,
                bookingId: (payment.bookingId as any) || null,
              },
              {
                ownerType: "doctor",
                ownerId: payment.doctorId as any,
                currency: currencyCode,
                amountMinor: doctorDeductMinor,
                direction: "debit",
                type: "CONSULTATION_CANCEL_DEDUCTION",
                referenceId: payment._id as any,
                bookingId: (payment.bookingId as any) || null,
              },
              {
                ownerType: "admin",
                currency: currencyCode,
                amountMinor: adminDeductMinor,
                direction: "debit",
                type: "CONSULTATION_CANCEL_DEDUCTION",
                referenceId: payment._id as any,
                bookingId: (payment.bookingId as any) || null,
              },
            ],
            { session, ordered: true }
          );

          // Keep existing behavior: booking becomes refunded
          await this._bookingRepo.updateBookingStatus(bookingId, "refunded", session);
        }
      });
    } finally {
      session.endSession();
    }

    // Notify doctor (real-time + DB) about cancellation/refund
    try {
      const notificationMsg = "Booking cancelled by user. Amount refunded to patient wallet.";
      const doctorIdStr = payment?.doctorId?.toString?.() || String(payment.doctorId);
      const bookingIdStr = (payment?.bookingId as any)?.toString?.() || bookingId;

      const notif = await NotificationModel.findOneAndUpdate(
        {
          userId: doctorIdStr,
          userRole: "doctor",
          type: "CONSULTATION_CANCELLED",
          "meta.bookingId": bookingIdStr,
        },
        {
          $setOnInsert: {
            message: notificationMsg,
            meta: { bookingId: bookingIdStr },
            read: false,
          },
        },
        { upsert: true, new: true }
      ).lean();

      if (io && doctorIdStr && notif?._id) {
        io.to(`user:${doctorIdStr}`).emit("notification:new", {
          _id: notif._id,
          message: notif.message,
          createdAt: notif.createdAt,
          read: notif.read,
          type: notif.type,
          meta: notif.meta,
        });
      }
    } catch (notifyErr) {
      console.error("[NOTIFICATION] doctor cancel notify error:", notifyErr);
    }

    return {
      success: true,
      message: "Booking cancelled and refunded successfully.",
    };
  }
}
