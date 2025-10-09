import { Router } from "express";
import { PaymentModel } from "../models/implements/payment.model";

const router = Router();

router.get("/payments/by-booking/:bookingId", async (req, res, next) => {
  try {
    const row = await PaymentModel
      .findOne({ bookingId: req.params.bookingId })
      .select("_id bookingId amount platformFee doctorEarning currency paymentStatus createdAt")
      .lean();
    if (!row) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: row });
  } catch (e) { next(e); }
});

export default router;
