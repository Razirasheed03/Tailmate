import { Router } from "express";
import { stripe } from "../utils/stripe";

const router = Router();

router.get("/checkout/session/:id", async (req, res, next) => {
  try {
    const ses = await stripe.checkout.sessions.retrieve(req.params.id);
    const payment_intent = typeof ses.payment_intent === "string"
      ? ses.payment_intent
      : (ses.payment_intent as any)?.id || null;

    res.json({
      success: true,
      data: {
        id: ses.id,
        payment_status: ses.payment_status,
        payment_intent,
        // doctor booking passthrough
        bookingId: ses.metadata?.bookingId || null,
        // marketplace passthrough
        kind: ses.metadata?.kind || null,
        orderId: ses.metadata?.orderId || null,
        listingId: ses.metadata?.listingId || null,
      },
    });
  } catch (err) { next(err); }
});

export default router;
