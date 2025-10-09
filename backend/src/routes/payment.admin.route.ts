// backend/src/routes/payment.admin.route.ts
import { Router } from "express";
import { PaymentModel } from "../models/implements/payment.model";
const router = Router();

router.get("/payments/admin-summary", async (_req, res, next) => {
  try {
    const agg = await PaymentModel.aggregate([
      { $match: { paymentStatus: "success" } },
      { $group: {
          _id: "$currency",
          totalPlatformFee: { $sum: "$platformFee" },
          totalDoctorEarning: { $sum: "$doctorEarning" },
          totalGross: { $sum: "$amount" },
        }
      }
    ]);
    res.json({ success: true, data: agg });
  } catch (e) { next(e); }
});

export default router;
