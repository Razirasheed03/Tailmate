// backend/src/services/interfaces/checkout.service.interface.ts
export type UIMode = "video" | "audio" | "inPerson";
export type PaymentMethod = "upi" | "card" | "netbanking" | "wallet";

export type QuoteInput = {
  doctorId: string;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:mm
  durationMins: number;
  mode: UIMode;
  baseFee: number;
};

export type QuoteOutput = {
  amount: number;
  tax?: number;
  discount?: number;
  totalAmount: number;
  currency: string;
};

export type CreateCheckoutInput = {
  doctorId: string;
  date: string;
  time: string;
  durationMins: number;
  mode: UIMode;
  amount: number;
  currency: string;
  petName: string;
  notes?: string;
  paymentMethod: PaymentMethod;
};

export type CreateCheckoutResult = {
  bookingId: string;
  redirectUrl?: string;
};

export interface ICheckoutService {
  getQuote(userId: string, input: QuoteInput): Promise<QuoteOutput>;
  createCheckout(userId: string, input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
}
