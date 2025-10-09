import { Request, Response } from "express";
import { PaymentService } from "../../services/implements/payment.service";

const svc = new PaymentService();

export const PaymentController = {
  createSession: async (req: Request, res: Response) => {
    const uid = (req as any)?.user?._id?.toString() || (req as any)?.user?.id;
    if (!uid) return res.status(401).json({ success: false, message: "Unauthorized" });
    try {
      const data = await svc.createCheckoutSession(req.body, uid);
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e?.message || "Failed" });
    }
  },
  webhook: async (req: Request, res: Response) => {
    try {
      await svc.processWebhook(req);
      res.json({ received: true });
    } catch (err: any) {
      res.status(400).send(`Webhook error: ${err?.message}`);
    }
  },
  doctorPayments: async (req: Request, res: Response) => {
    const did = (req as any)?.user?._id?.toString() || (req as any)?.user?.id;
    if (!did) return res.status(401).json({ success: false, message: "Unauthorized" });
    const data = await svc.doctorPayments(did);
    res.json({ success: true, data });
  },
};
