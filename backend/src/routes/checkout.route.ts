// backend/src/routes/checkout.routes.ts
import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { authJwt } from "../middlewares/authJwt";
import { checkoutController } from "../dependencies/checkout.di";

const router = Router();

// Auth required for checkout flows
router.use(authJwt);

// POST /api/checkout/quote  -> compute pricing (tax/discounts)
router.post("/quote", asyncHandler(checkoutController.getQuote));

// POST /api/checkout/create -> create booking + payment session (pending)
router.post("/create", asyncHandler(checkoutController.createCheckout));


export default router;
