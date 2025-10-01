// backend/src/services/implements/checkout.service.ts
import { Types } from "mongoose";
import { ICheckoutService, QuoteInput, QuoteOutput, CreateCheckoutInput, CreateCheckoutResult } from "../interfaces/checkout.service.interface";
import { BookingRepository } from "../../repositories/implements/booking.repository";
import { DoctorSlotReadRepository } from "../../repositories/implements/doctorSlot.read.repository";
import { DoctorPublicRepository } from "../../repositories/implements/doctorPublic.repository";
import { DoctorSlotWriteRepository } from "../../repositories/implements/doctorSlot.write.repository";

export class CheckoutService implements ICheckoutService {
  constructor(
    private readonly _bookingRepo = new BookingRepository(),
    private readonly _slotRepo = new DoctorSlotReadRepository(),
    private readonly _doctorPubRepo = new DoctorPublicRepository(),
    private readonly _slotWriteRepo = new DoctorSlotWriteRepository()
  ) {}

  private mustObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error("Invalid id");
  }

  private validateQuotePayload(input: QuoteInput) {
    if (!input?.doctorId) throw new Error("doctorId is required");
    if (!input?.date) throw new Error("date is required");
    if (!input?.time) throw new Error("time is required");
    if (!input?.durationMins) throw new Error("durationMins is required");
    if (!input?.baseFee && input.baseFee !== 0) throw new Error("baseFee is required");
  }

  async getQuote(userId: string, input: QuoteInput): Promise<QuoteOutput> {
    this.mustObjectId(userId);
    this.mustObjectId(input.doctorId);
    this.validateQuotePayload(input);

    const doctor = await this._doctorPubRepo.getDoctorPublicById(input.doctorId);
    if (!doctor) throw new Error("Doctor not found or not verified");

    const slot = await this._slotRepo.findExactAvailable(input.doctorId, input.date, input.time);
    if (!slot) throw new Error("Selected slot is not available");

    if (slot.durationMins !== input.durationMins) {
      // optional: enforce equality
    }
    if (!slot.modes?.includes(input.mode)) {
      throw new Error("Selected mode not available on this slot");
    }

    const amount = Math.max(0, Number(input.baseFee || 0));
    const tax = Math.round(amount * 0.18);
    const discount = 0;
    const totalAmount = amount + tax - discount;

    return { amount, tax, discount, totalAmount, currency: "INR" };
  }

  private validateCreatePayload(input: CreateCheckoutInput) {
    if (!input?.doctorId) throw new Error("doctorId is required");
    if (!input?.date) throw new Error("date is required");
    if (!input?.time) throw new Error("time is required");
    if (!input?.durationMins) throw new Error("durationMins is required");
    if (!input?.amount && input.amount !== 0) throw new Error("amount is required");
    if (!input?.currency) throw new Error("currency is required");
    if (!input?.petName?.trim()) throw new Error("petName is required");
    if (!input?.paymentMethod) throw new Error("paymentMethod is required");
  }

  async createCheckout(userId: string, input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    this.mustObjectId(userId);
    this.mustObjectId(input.doctorId);
    this.validateCreatePayload(input);

    const doctor = await this._doctorPubRepo.getDoctorPublicById(input.doctorId);
    if (!doctor) throw new Error("Doctor not found or not verified");

    const slot = await this._slotRepo.findExactAvailable(input.doctorId, input.date, input.time);
    if (!slot) throw new Error("Selected slot is not available");

    if (!slot.modes?.includes(input.mode)) {
      throw new Error("Selected mode not available on this slot");
    }

    const paymentProvider = "mock";
    const paymentSessionId = "";
    const paymentRedirectUrl = "";

    const created = await this._bookingRepo.create({
      patientId: userId,
      doctorId: input.doctorId,
      slotId: String(slot._id),
      date: input.date,
      time: input.time,
      durationMins: input.durationMins,
      mode: input.mode,
      amount: input.amount,
      currency: input.currency,
      petName: input.petName.trim(),
      notes: input.notes?.trim() || "",
      paymentMethod: input.paymentMethod,
      paymentProvider,
      paymentSessionId,
      paymentRedirectUrl,
    });

    return { bookingId: String(created._id), redirectUrl: paymentRedirectUrl || undefined };
  }

  async mockPay(userId: string, bookingId: string) {
    this.mustObjectId(userId);
    this.mustObjectId(bookingId);

    const booking = await this._bookingRepo.findById(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (String(booking.patientId) !== String(userId)) throw new Error("Forbidden");
    if (booking.status !== "pending") return { status: booking.status, bookingId };

    if (booking.slotId) {
      const booked = await this._slotWriteRepo.markBooked(String(booking.slotId));
      if (!booked) {
        await this._bookingRepo.updateStatus(bookingId, "failed");
        throw new Error("Slot was taken by another booking");
      }
    }
    const updated = await this._bookingRepo.markPaid(bookingId);
    return { status: updated?.status || "paid", bookingId };
  }
}
