//server.ts
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/mongodb";
import { env } from "./config/env";
import { Consultation } from "./schema/consultation.schema";

import authRoutes from "./routes/auth.route";
import adminRoutes from "./routes/admin.route";
import petRoutes from "./routes/pet.route";
import doctorRoutes from "./routes/doctor.route";
import userRoutes from "./routes/user.route";
import marketplaceRoutes from "./routes/marketplace.route";
import checkoutRoutes from "./routes/checkout.route";
import checkoutSessionRoutes from "./routes/checkout.session.route";
import bookingReadRoutes from "./routes/booking.read.route";
import paymentReadRoutes from "./routes/payment.read.route";
import paymentRoutes from "./routes/payment.route";
import marketplacePaymentRoutes from "./routes/marketplace.payment.route";
import payoutRoutes from "./routes/payout.route";
import { paymentsWebhook } from "./controllers/Implements/payment-webhook.controller";
import notificationRoutes from "./routes/notification.route";
import matchmakingRoutes from "./routes/matchmaking.route";
import chatRoutes from "./routes/chat.route";
import consultationRoutes from "./routes/consultation.route";
import uploadRoutes from "./routes/upload.route";

import http from "http";
import { Server } from "socket.io";
import { initializeSocketServer } from "./sockets/index";
import { setSocketServer } from "./sockets/io";
import { consultationController } from "./dependencies/consultation.di";
import { chatController } from "./dependencies/chat.di";
import { errorHandler } from "./http/error.middleware";

const app = express();
const server = http.createServer(app);

const allowedOrigins = env.ALLOWED_ORIGINS;

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  transports: ["websocket", "polling"],
  allowUpgrades: true,
});

setSocketServer(io);

const consultationService = consultationController.getService();
const chatService = chatController.getService();

initializeSocketServer(io, consultationService, chatService);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        if (env.isProduction) {
          return callback(null, false);
        }
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

let dbReady = false;

const requireDbReady: express.RequestHandler = (_req, res, next) => {
  if (!dbReady) {
    return res.status(503).json({
      success: false,
      message: "Database initializing...",
    });
  }
  next();
};

app.post(
  "/api/payments/webhook",
  requireDbReady,
  express.raw({ type: "application/json" }),
  paymentsWebhook
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);

app.get("/api/health", (_req, res) => {
  if (!dbReady) {
    return res.status(503).json({
      status: "warming",
      message: "Database initializing",
    });
  }

  res.status(200).json({ status: "ready" });
});

connectDB()
  .then(async () => {
    try {
      const indexes = await Consultation.collection.getIndexes();

      if (indexes.videoRoomId_1) {
        await Consultation.collection.dropIndex("videoRoomId_1");
        console.log("Old videoRoomId index dropped");
      }

      if (!env.isProduction) {
        await Consultation.syncIndexes();
        console.log("Consultation indexes synced (development)");
      }
    } catch (err: any) {
      console.error("Index maintenance warning:", err?.message);
    }

    dbReady = true;
  })
  .catch((err) => {
    console.error("Mongo connect error:", err);
    process.exit(1);
  });

app.use((req, res, next) => {
  if (req.path.startsWith("/socket.io")) {
    return next();
  }
  if (req.path === "/api/health") {
    return next();
  }
  if (req.path === "/api/payments/webhook") {
    return next();
  }
  if (!dbReady) {
    return res.status(503).json({
      success: false,
      message: "Database initializing...",
    });
  }
  next();
});

app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/matchmaking", matchmakingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api", userRoutes);
app.use("/api", bookingReadRoutes);
app.use("/api", petRoutes);
app.use("/api", payoutRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api", checkoutSessionRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api", paymentReadRoutes);
app.use("/api/marketplace-payments", marketplacePaymentRoutes);
app.use("/api", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/consultations", consultationRoutes);

app.use(errorHandler);

server.listen(env.PORT, () => {
  console.log(`Server running on ${env.PORT}`);
  console.log("Stripe webhook path: POST /api/payments/webhook");
  console.log("Socket.IO server running!");
});
