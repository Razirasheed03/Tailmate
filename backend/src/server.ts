import dotenv from 'dotenv';
dotenv.config()
import { env } from './config/env'
import express from "express";
import { connectDB } from "./config/mongodb";
import authRoutes from "./routes/auth.route";
import adminRoutes from './routes/admin.route'
import petRoutes from './routes/pet.route';
import doctorRoutes from "./routes/doctor.route";
import userRoutes from './routes/user.route';
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(express.json())
app.use(cookieParser());

connectDB()
app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes);
app.use("/api/doctor", doctorRoutes);
app.use('/api', userRoutes);
app.use('/api', petRoutes);
app.use((err: any, req: any, res: any, next: any) => {
  res.status(err.status || 400).json({
    success: false,
    message: err.message || "Something went wrong."
  });
});
app.listen(env.PORT, () => {
  console.log(`Server running on ${env.PORT}`)
})