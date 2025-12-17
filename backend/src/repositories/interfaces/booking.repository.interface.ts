import type { BookingLean } from "../../schema/booking.schema";

export interface IBookingRepository {
  create(attrs: {
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
  }): Promise<BookingLean>;

  markPaid(bookingId: string, sessionId?: string): Promise<BookingLean | null>;

  updateStatus(
    bookingId: string,
    status: "pending" | "paid" | "cancelled" | "failed" | "refunded"
  ): Promise<BookingLean | null>;

  updateBookingStatus(
    bookingId: string,
    newStatus: string
  ): Promise<any | null>;

  findById(bookingId: string): Promise<BookingLean | null>;

  listUserBookings(params: {
    userId: string;
    page: number;
    limit: number;
    scope: "upcoming" | "today" | "past" | "all";
    status?: string;
    mode?: string;
    q?: string;
  }): Promise<{ items: any[]; total: number }>;

  getUserBookingById(
    userId: string,
    bookingId: string
  ): Promise<any | null>;

  cancelUserBooking(
    userId: string,
    bookingId: string
  ): Promise<BookingLean | null>;
}
