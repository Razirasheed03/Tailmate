// backend/src/services/implements/payout.service.ts
import { Wallet } from "../../schema/wallet.schema";
import { Payout } from "../../schema/payout.schema";
import { DoctorModel } from "../../models/implements/doctor.model";
import { stripe } from "../../utils/stripe";
import { DoctorPayoutModel } from "../../schema/doctorPayout.schema";

export class PayoutService {
  async requestPayout(ownerType: "user" | "doctor", ownerId: string, amount: number, currency: string) {
    // Ensure enough balance
    const wallet = await Wallet.findOne({ ownerType, ownerId, currency });
    if (!wallet || wallet.balanceMinor < amount * 100) {
      throw new Error("Insufficient wallet balance");
    }

    // Deduct wallet balance immediately (optimistic approach)
    await Wallet.updateOne(
      { ownerType, ownerId, currency },
      { $inc: { balanceMinor: -Math.round(amount * 100) } }
    );

    // Create payout request
    const payout = await Payout.create({
      ownerType,
      ownerId,
      amountMinor: Math.round(amount * 100),
      currency,
      status: "pending",
      requestedAt: new Date(),
    });

    return payout;
  }

  // Mark payout as completed/failed after manual or automated processing
  async completePayout(payoutId: string) {
    return await Payout.findByIdAndUpdate(payoutId, {
      status: "completed", completedAt: new Date()
    }, { new: true });
  }

  async failPayout(payoutId: string, reason: string) {
    // Optionally refund the wallet if failed
    const payout = await Payout.findByIdAndUpdate(payoutId, {
      status: "failed", failureReason: reason
    }, { new: true });
    if (payout) {
      await Wallet.updateOne(
        { ownerType: payout.ownerType, ownerId: payout.ownerId, currency: payout.currency },
        { $inc: { balanceMinor: payout.amountMinor } }
      );
    }
    return payout;
  }

  // Show payout history for a user/doctor
  async listPayouts(ownerType: string, ownerId: string) {
    return await Payout.find({ ownerType, ownerId }).sort({ requestedAt: -1 }).lean();
  }
  doctorPayout= async (userId: string, amount: number) => {
    const doctor = await DoctorModel.findOne({ userId });
    if (!doctor || !doctor.stripeAccountId)
      throw new Error("Stripe not connected");

    // TODO: Check available balance logic here!

    // Create payout with Stripe Connect (sandbox will only simulate)
    await stripe.transfers.create({
      amount: Math.floor(amount * 100), // INR: paise, USD: cents
      currency: "inr",
      destination: doctor.stripeAccountId,
      description: "Doctor payout",
    });

    // Record payout in DB
    await DoctorPayoutModel.create({
      doctorId: doctor._id,
      amount,
      status: "pending",
      createdAt: new Date(),
    });

    return { message: "Payout requested" };
  }

  getDoctorPayouts= async (userId: string) => {
    const doctor = await DoctorModel.findOne({ userId });
    if (!doctor) return [];
    return DoctorPayoutModel.find({ doctorId: doctor._id })
      .sort({ createdAt: -1 })
      .lean();
  }

}
