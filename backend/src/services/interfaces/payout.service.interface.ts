export interface IPayoutService {
  requestPayout(
    ownerType: "user" | "doctor",
    ownerId: string,
    amount: number,
    currency: string
  ): Promise<any>;

  completePayout(payoutId: string): Promise<any>;

  failPayout(payoutId: string, reason: string): Promise<any>;

  listPayouts(ownerType: string, ownerId: string): Promise<any[]>;

  doctorPayout(userId: string, amount: number): Promise<{ message: string }>;

  getDoctorPayouts(userId: string): Promise<any[]>;
}
