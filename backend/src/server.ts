//beackend/src/server.ts
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/mongodb";
import { env } from "./config/env";

// Routes
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

// Webhook controller
import { paymentsWebhook } from "./controllers/Implements/payment-webhook.controller";

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

// 1) Stripe webhook: raw body mount BEFORE JSON parser
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  (req, _res, next) => { console.log("HIT /api/payments/webhook"); next(); },
  paymentsWebhook
);

// 2) Regular parsers for all other routes
app.use(express.json());
app.use(cookieParser());

// 3) Connect DB
connectDB().then(() => {
  console.log("Mongo connected");
}).catch((err) => {
  console.error("Mongo connect error:", err);
  process.exit(1);
});

// 4) Mount application routes
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api", userRoutes);
app.use("/api", petRoutes);
app.use("/api", bookingReadRoutes);

// Booking/session helpers
app.use("/api/checkout", checkoutRoutes);
app.use("/api", checkoutSessionRoutes);

// Payments (JSON body)
app.use("/api/payments", paymentRoutes);
app.use("/api", paymentReadRoutes);

// 5) Centralized error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Error handler:", err?.message);
  res.status(err.status || 400).json({
    success: false,
    message: err.message || "Something went wrong.",
  });
});

app.listen(env.PORT, () => {
  console.log(`Server running on ${env.PORT}`);
  console.log("Stripe webhook path: POST /api/payments/webhook");
});
