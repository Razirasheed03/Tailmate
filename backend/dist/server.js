"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const env_1 = require("./config/env");
const express_1 = __importDefault(require("express"));
const mongodb_1 = require("./config/mongodb");
const authRoute_1 = __importDefault(require("./routes/auth/authRoute"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: "http://localhost:3000",
    credentials: true,
}));
app.use(express_1.default.json());
(0, mongodb_1.connectDB)();
app.use("/api/auth", authRoute_1.default);
app.use((err, req, res, next) => {
    res.status(err.status || 400).json({
        success: false,
        message: err.message || "Something went wrong."
    });
});
app.listen(env_1.env.PORT, () => {
    console.log(`Server running on ${env_1.env.PORT}`);
});
