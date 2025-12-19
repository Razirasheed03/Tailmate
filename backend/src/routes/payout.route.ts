// backend/src/routes/payout.route.ts
import { Router } from "express";
import { authJwt } from "../middlewares/authJwt";
import { asyncHandler } from "../utils/asyncHandler";
import { payoutController } from "../dependencies/payout.di";

const router = Router();
const c = payoutController;

router.use(authJwt);

router.post("/payout/request", asyncHandler((req, res, next) => c.requestPayout(req, res, next)));
router.get("/payout/history", asyncHandler((req, res, next) => c.listMyPayouts(req, res, next)));

export default router;