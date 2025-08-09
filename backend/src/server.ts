import dotenv from 'dotenv';
dotenv.config()
import { env } from './config/env'
import express from "express";
import { connectDB } from "./config/mongodb";
import authRoutes from "./routes/auth/authRoute";
import cors from "cors"

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(express.json())
connectDB()
app.use("/api/auth", authRoutes)

app.use((err: any, req: any, res: any, next: any) => {
  res.status(err.status || 400).json({
    success: false,
    message: err.message || "Something went wrong."
  });
});
app.listen(env.PORT, () => {
  console.log(`Server running on ${env.PORT}`)
})