import { Router } from "express";
import { PaymentModel } from "../models/implements/payment.model";

const router = Router();

router.get("/payments/by-booking/:bookingId", async (req, res, next) => {
  try {
    const bookingId = req.params.bookingId;

    const row = await PaymentModel
      .findOne({ bookingId, paymentStatus: "success" })
      .select("_id bookingId amount platformFee doctorEarning currency paymentStatus createdAt")
      .lean();

    const fallback = row
      ? null
      : await PaymentModel
          .findOne({ bookingId })
          .sort({ createdAt: -1 })
          .select("_id bookingId amount platformFee doctorEarning currency paymentStatus createdAt")
          .lean();

    const found = row || fallback;
    if (!found) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: found });
  } catch (e) { next(e); }
});

export default router;
