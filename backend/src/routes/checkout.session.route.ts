import { Router } from "express";
import { stripe } from "../utils/stripe";
import { authJwt } from "../middlewares/authJwt";
import { ResponseHelper } from "../http/ResponseHelper";
import { HttpResponse } from "../constants/messageConstant";

const router = Router();

router.get("/checkout/session/:id", authJwt, async (req, res, next) => {
  try {
    const userId = (req as any)?.user?.id?.toString();
    if (!userId) {
      return ResponseHelper.unauthorized(res, HttpResponse.UNAUTHORIZED);
    }

    const ses = await stripe.checkout.sessions.retrieve(req.params.id);
    const metadata = ses.metadata || {};
    const kind = metadata.kind || "doctor";

    if (kind === "doctor") {
      if (metadata.patientId && String(metadata.patientId) !== userId) {
        return ResponseHelper.forbidden(res, "Forbidden");
      }
    } else if (kind === "marketplace") {
      if (metadata.buyerId && String(metadata.buyerId) !== userId) {
        return ResponseHelper.forbidden(res, "Forbidden");
      }
    }

    const payment_intent =
      typeof ses.payment_intent === "string"
        ? ses.payment_intent
        : (ses.payment_intent as { id?: string } | null)?.id || null;

    return ResponseHelper.ok(
      res,
      {
        id: ses.id,
        payment_status: ses.payment_status,
        payment_intent,
        bookingId: metadata.bookingId || null,
        kind: metadata.kind || null,
        orderId: metadata.orderId || null,
        listingId: metadata.listingId || null,
      },
      HttpResponse.RESOURCE_FOUND
    );
  } catch (err) {
    next(err);
  }
});

export default router;
