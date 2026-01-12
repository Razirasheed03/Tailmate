//server.ts
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
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
import matchmakingRoutes from "./routes/matchmaking.route"
import chatRoutes from "./routes/chat.route";
import consultationRoutes from "./routes/consultation.route";
import uploadRoutes from "./routes/upload.route";

import http from "http";
import { Server } from "socket.io";
import { initializeSocketServer } from "./sockets/index";
import { consultationController } from "./dependencies/consultation.di";
import { chatController } from "./dependencies/chat.di";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",

  "https://tailmate-care.vercel.app"
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  transports: ["websocket", "polling"],
  allowUpgrades: true,
});

// Extract services from DI containers and inject into socket layer
const consultationService = consultationController.getService();
const chatService = chatController.getService();

initializeSocketServer(io, consultationService, chatService);

export { io };


app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
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


app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  (req, _res, next) => { console.log("HIT /api/payments/webhook"); next(); },
  paymentsWebhook
);

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  if (!dbReady) {
    return res.status(503).json({
      status: "warming",
      message: "Database initializing",
    });
  }

  res.status(200).json({ status: "ready" });
});


// Initialize database and drop old indexes BEFORE registering routes
let dbReady = false;

connectDB().then(async () => {
  try {
    const indexes = await Consultation.collection.getIndexes();
    
    if (indexes.videoRoomId_1) {
      await Consultation.collection.dropIndex("videoRoomId_1");
      console.log("✅ Old videoRoomId index dropped");
    } else {
      console.log("✅ No old videoRoomId index found");
    }
    await Consultation.collection.dropIndexes();
    await Consultation.syncIndexes();
    console.log("✅ Indexes rebuilt successfully");
  } catch (err: any) {
    if (err.message.includes("index not found") || err.message.includes("cannot drop")) {
      console.log("✅ Index cleanup completed");
    } else {
      console.error("⚠️ Error managing indexes:", err.message);
    }
  }
  
  dbReady = true;
}).catch((err) => {
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
  if (!dbReady) {
    return res.status(503).json({
      success: false,
      message: "Database initializing...",
    });
  }
  next();
});


app.use("/api/marketplace", marketplaceRoutes);
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
app.use("/api/matchmaking", matchmakingRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/consultations", consultationRoutes);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Error handler:", err?.message);
  res.status(err.status || 400).json({
    success: false,
    message: err.message || "Something went wrong.",
  });
});


server.listen(env.PORT, () => {
  console.log(`Server running on ${env.PORT}`);
  console.log("Stripe webhook path: POST /api/payments/webhook");
  console.log("Socket.IO server running!");
});
