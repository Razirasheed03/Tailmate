import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/mongodb";
import { env } from "./config/env";

// --- Routes (all your imports unchanged) ---
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

// --- SOCKET.IO imports ---
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app); // Create HTTP server

// --- Socket.IO ---
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // frontend dev address
    credentials: true,
  },
});

// --- Real-time Doctor Notification (DO NOT REMOVE this logic) ---
io.on("connection", (socket) => {
  console.log("Socket.IO: New user connected", socket.id);

  socket.on("identify_as_doctor", (doctorId: string) => {
    const room = `doctor_${doctorId}`;
    socket.join(room);
    console.log("Doctor joined room:", room, socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Socket.IO: User disconnected", socket.id);
  });
});

// (Export for use in webhooks etc)
export { io };

// --- Express Setup ---

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

// Stripe webhook: raw body FIRST for Stripe signature!
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  (req, _res, next) => { console.log("HIT /api/payments/webhook"); next(); },
  paymentsWebhook
);

// Parsers for all other routes
app.use(express.json());
app.use(cookieParser());

// DB Connect (async)
connectDB().then(() => {
  console.log("Mongo connected");
}).catch((err) => {
  console.error("Mongo connect error:", err);
  process.exit(1);
});

// Mount all user and admin routes (nothing removed, exactly as before)
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
// Centralized error handler (keep unchanged)
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Error handler:", err?.message);
  res.status(err.status || 400).json({
    success: false,
    message: err.message || "Something went wrong.",
  });
});

// Listen on all interfaces
server.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Server running on ${env.PORT}`);
  console.log("Stripe webhook path: POST /api/payments/webhook");
  console.log("Socket.IO server running!");
});
