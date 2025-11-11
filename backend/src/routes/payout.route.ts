// backend/src/routes/payout.route.ts
import { Router } from "express";

const router = Router();
import { requestPayout, listMyPayouts } from "../controllers/Implements/payout.controller";
router.post("/payout/request", requestPayout);
router.get("/payout/history", listMyPayouts);
export default router