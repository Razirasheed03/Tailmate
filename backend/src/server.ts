import dotenv from 'dotenv';
dotenv.config()
import {env} from './config/env'
import  express  from "express";
import { connectDB } from "./config/mongodb";
import authRoutes from "./routes/auth/authRoute";
import cors from "cors"

const app=express();

app.use(cors({
    origin: "http://localhost:3000", // allow Vite frontend
    credentials: true,              // allow cookies/auth headers if needed
}));

app.use(express.json())
connectDB()
app.use("/api/auth", authRoutes)

app.listen(env.PORT,()=>{
    console.log(`Server running on ${env.PORT}`)
})