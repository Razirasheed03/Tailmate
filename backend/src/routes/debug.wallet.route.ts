// backend/src/routes/debug.wallet.route.ts (unauthenticated for local debugging)
import { Router } from "express";
import { Booking } from "../schema/booking.schema";
import { Ledger } from "../schema/ledger.schema";
import { Wallet } from "../schema/wallet.schema";

const router = Router();

// GET /api/debug/wallet-by-pi/:pi
router.get("/debug/wallet-by-pi/:pi", async (req, res, next) => {
  try {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({ success: false, message: "Disabled" });
    }
    const pi = String(req.params.pi);
    const booking = await Booking.findOne({ paymentIntentId: pi }).lean();
    const ledgers = await Ledger.find({ paymentIntentId: pi }).lean();
    const wallets = await Wallet.find({}).lean();
    res.json({ success: true, data: { booking, ledgers, wallets } });
  } catch (e) { next(e); }
});

export default router;
