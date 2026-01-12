import { Router } from "express";
import { authJwt } from "../middlewares/authJwt";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadChatFile } from "../middlewares/upload";
import { uploadController } from "../controllers/Implements/upload.controller";

const router = Router();

router.use(authJwt);

router.post("/chat", uploadChatFile, asyncHandler(uploadController.uploadChat));

export default router;
