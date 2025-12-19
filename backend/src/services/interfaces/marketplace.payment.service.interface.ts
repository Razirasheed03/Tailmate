export type CreateSessionPayload = { listingId: string };
export type CreateSessionResp = { url: string | null; orderId: string };

export interface IMarketplacePaymentService {
  createCheckoutSession(payload: CreateSessionPayload, buyerId: string): Promise<CreateSessionResp>;
}
