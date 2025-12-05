import { Router } from "express";
import { authJwt } from "../middlewares/authJwt";
import { asyncHandler } from "../utils/asyncHandler";
import { ChatController } from "../controllers/Implements/chat.controller";

const router = Router();
const c = new ChatController();

router.use(authJwt);

router.post("/start", asyncHandler(c.startChat));
router.get("/rooms", asyncHandler(c.listRooms));
router.get("/messages/:roomId", asyncHandler(c.listMessages));
router.post("/send", asyncHandler(c.sendMessage));
router.post("/delivered/:roomId", asyncHandler(c.markDelivered));
router.post("/seen/:roomId", asyncHandler(c.markSeen));

export default router;
