// backend/src/routes/booking.read.route.ts
import { Router } from "express";
import { Booking } from "../schema/booking.schema";

const router = Router();

// GET /api/bookings/:id
router.get("/bookings/:id", async (req, res, next) => {
  try {
    const doc = await Booking.findById(req.params.id)
      .select("_id status amount currency doctorId patientId createdAt")
      .lean();
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

export default router;
