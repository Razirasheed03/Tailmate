"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
//server.ts
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const mongodb_1 = require("./config/mongodb");
const env_1 = require("./config/env");
const consultation_schema_1 = require("./schema/consultation.schema");
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const admin_route_1 = __importDefault(require("./routes/admin.route"));
const pet_route_1 = __importDefault(require("./routes/pet.route"));
const doctor_route_1 = __importDefault(require("./routes/doctor.route"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const marketplace_route_1 = __importDefault(require("./routes/marketplace.route"));
const checkout_route_1 = __importDefault(require("./routes/checkout.route"));
const checkout_session_route_1 = __importDefault(require("./routes/checkout.session.route"));
const booking_read_route_1 = __importDefault(require("./routes/booking.read.route"));
const payment_read_route_1 = __importDefault(require("./routes/payment.read.route"));
const payment_route_1 = __importDefault(require("./routes/payment.route"));
const marketplace_payment_route_1 = __importDefault(require("./routes/marketplace.payment.route"));
const payout_route_1 = __importDefault(require("./routes/payout.route"));
const payment_webhook_controller_1 = require("./controllers/Implements/payment-webhook.controller");
const notification_route_1 = __importDefault(require("./routes/notification.route"));
const matchmaking_route_1 = __importDefault(require("./routes/matchmaking.route"));
const chat_route_1 = __importDefault(require("./routes/chat.route"));
const consultation_route_1 = __importDefault(require("./routes/consultation.route"));
const upload_route_1 = __importDefault(require("./routes/upload.route"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const index_1 = require("./sockets/index");
const consultation_di_1 = require("./dependencies/consultation.di");
const chat_di_1 = require("./dependencies/chat.di");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const allowedOrigins = [
    "http://localhost:3000",
    "https://tailmate-care.vercel.app"
];
const io = new socket_io_1.Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    },
    transports: ["websocket", "polling"],
    allowUpgrades: true,
});
exports.io = io;
// Extract services from DI containers and inject into socket layer
const consultationService = consultation_di_1.consultationController.getService();
const chatService = chat_di_1.chatController.getService();
(0, index_1.initializeSocketServer)(io, consultationService, chatService);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.post("/api/payments/webhook", express_1.default.raw({ type: "application/json" }), (req, _res, next) => { console.log("HIT /api/payments/webhook"); next(); }, payment_webhook_controller_1.paymentsWebhook);
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
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
(0, mongodb_1.connectDB)().then(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const indexes = yield consultation_schema_1.Consultation.collection.getIndexes();
        if (indexes.videoRoomId_1) {
            yield consultation_schema_1.Consultation.collection.dropIndex("videoRoomId_1");
            console.log("✅ Old videoRoomId index dropped");
        }
        else {
            console.log("✅ No old videoRoomId index found");
        }
        yield consultation_schema_1.Consultation.collection.dropIndexes();
        yield consultation_schema_1.Consultation.syncIndexes();
        console.log("✅ Indexes rebuilt successfully");
    }
    catch (err) {
        if (err.message.includes("index not found") || err.message.includes("cannot drop")) {
            console.log("✅ Index cleanup completed");
        }
        else {
            console.error("⚠️ Error managing indexes:", err.message);
        }
    }
    dbReady = true;
})).catch((err) => {
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
app.use("/api/marketplace", marketplace_route_1.default);
app.use("/api/auth", auth_route_1.default);
app.use("/api/admin", admin_route_1.default);
app.use("/api/doctor", doctor_route_1.default);
app.use("/api", user_route_1.default);
app.use("/api", booking_read_route_1.default);
app.use("/api", pet_route_1.default);
app.use("/api", payout_route_1.default);
app.use("/api/checkout", checkout_route_1.default);
app.use("/api", checkout_session_route_1.default);
app.use("/api/payments", payment_route_1.default);
app.use("/api", payment_read_route_1.default);
app.use("/api/marketplace-payments", marketplace_payment_route_1.default);
app.use("/api", notification_route_1.default);
app.use("/api/matchmaking", matchmaking_route_1.default);
app.use("/api/chat", chat_route_1.default);
app.use("/api/upload", upload_route_1.default);
app.use("/api/consultations", consultation_route_1.default);
app.use((err, _req, res, _next) => {
    console.error("Error handler:", err === null || err === void 0 ? void 0 : err.message);
    res.status(err.status || 400).json({
        success: false,
        message: err.message || "Something went wrong.",
    });
});
server.listen(env_1.env.PORT, () => {
    console.log(`Server running on ${env_1.env.PORT}`);
    console.log("Stripe webhook path: POST /api/payments/webhook");
    console.log("Socket.IO server running!");
});
