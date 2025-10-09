// backend/src/routes/checkout.session.route.ts
import { Router } from "express";
import { stripe } from "../utils/stripe";

const router = Router();

// GET /api/checkout/session/:id
router.get("/checkout/session/:id", async (req, res, next) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id);
    res.json({
      success: true,
      data: {
        id: session.id,
        payment_status: session.payment_status,
        bookingId: session.metadata?.bookingId,
        payment_intent: session.payment_intent,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
