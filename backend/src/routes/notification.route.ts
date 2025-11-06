import { Router } from "express";
import { NotificationController } from "../controllers/Implements/notification.controller";
import { authJwt } from "../middlewares/authJwt";
import { requireRole } from "../middlewares/requireRoles";
import { UserRole } from "../constants/roles";

const router = Router();

router.get("/notifications", authJwt, NotificationController.getMyNotifications);

router.post("/notifications", authJwt, requireRole([UserRole.ADMIN]), NotificationController.create);

export default router;
