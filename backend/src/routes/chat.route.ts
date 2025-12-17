import { Router } from "express";
import { authJwt } from "../middlewares/authJwt";
import { asyncHandler } from "../utils/asyncHandler";
import { chatController } from "../dependencies/chat.di";

const router = Router();

router.use(authJwt);

router.post("/start", asyncHandler(chatController.startChat));
router.get("/rooms", asyncHandler(chatController.listRooms));
router.get("/messages/:roomId", asyncHandler(chatController.listMessages));
router.post("/send", asyncHandler(chatController.sendMessage));
router.post("/delivered/:roomId", asyncHandler(chatController.markDelivered));
router.post("/seen/:roomId", asyncHandler(chatController.markSeen));

export default router;
