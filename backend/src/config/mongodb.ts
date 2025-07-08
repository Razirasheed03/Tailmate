import mongoose from "mongoose";
import { env } from "./env"; // ✅ use from env.ts

export const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI); // ✅ now it's safe
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error);
    process.exit(1);
  }
};
