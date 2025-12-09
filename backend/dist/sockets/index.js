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
exports.initializeSocketServer = initializeSocketServer;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const chat_service_1 = require("../services/implements/chat.service");
const consultation_service_1 = require("../services/implements/consultation.service");
function initializeSocketServer(io) {
    // Middleware: Authenticate ALL connections
    io.use((socket, next) => {
        var _a;
        const token = socket.handshake.auth.token ||
            ((_a = socket.handshake.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1]);
        if (!token) {
            return next(new Error("Authentication required"));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.username = decoded.username;
            next();
        }
        catch (err) {
            next(new Error("Invalid token"));
        }
    });
    io.on("connection", (socket) => {
        const userId = socket.userId;
        console.log(`[Socket] ✅ Connected: ${socket.id} | User: ${userId}`);
        // ========================================
        // CONSULTATION / WEBRTC EVENTS
        // ========================================
        socket.on("consultation:join", (data) => __awaiter(this, void 0, void 0, function* () {
            try {
                const consultationService = new consultation_service_1.ConsultationService();
                const consultation = yield consultationService.getConsultation(data.consultationId);
                // Verify authorization
                const doctorUserId = extractUserId(consultation.doctorId);
                const patientUserId = extractUserId(consultation.userId);
                const isAuthorized = userId === doctorUserId || userId === patientUserId;
                if (!isAuthorized) {
                    socket.emit("consultation:error", { message: "Unauthorized" });
                    return;
                }
                if (consultation.videoRoomId !== data.videoRoomId) {
                    socket.emit("consultation:error", { message: "Invalid room" });
                    return;
                }
                const roomName = `consultation:${data.videoRoomId}`;
                yield socket.join(roomName);
                const roomSockets = yield io.in(roomName).fetchSockets();
                const isDoctor = userId === doctorUserId;
                console.log(`[Consultation] ✅ ${isDoctor ? 'DOCTOR' : 'PATIENT'} joined ${roomName}`);
                console.log(`[Consultation] Room has ${roomSockets.length} participants`);
                // Tell everyone else someone joined
                socket.to(roomName).emit("consultation:peer-joined", {
                    userId,
                    isDoctor,
                    socketId: socket.id,
                });
                // Tell this socket they successfully joined
                socket.emit("consultation:joined", {
                    success: true,
                    roomName,
                    participantCount: roomSockets.length,
                    otherParticipants: roomSockets
                        .filter(s => s.id !== socket.id)
                        .map(s => ({
                        socketId: s.id,
                        userId: s.userId,
                    })),
                });
            }
            catch (err) {
                console.error("[Consultation] Join error:", err);
                socket.emit("consultation:error", { message: err.message });
            }
        }));
        // WebRTC Signaling - Simple forwarding
        socket.on("consultation:signal", (data) => {
            const roomName = `consultation:${data.videoRoomId}`;
            console.log(`[WebRTC] Signal from ${socket.id}:`, data.signal.type);
            if (data.targetSocketId) {
                // Send to specific peer
                io.to(data.targetSocketId).emit("consultation:signal", {
                    fromSocketId: socket.id,
                    fromUserId: userId,
                    signal: data.signal,
                });
            }
            else {
                // Broadcast to room
                socket.to(roomName).emit("consultation:signal", {
                    fromSocketId: socket.id,
                    fromUserId: userId,
                    signal: data.signal,
                });
            }
        });
        socket.on("consultation:leave", (data) => __awaiter(this, void 0, void 0, function* () {
            const roomName = `consultation:${data.videoRoomId}`;
            socket.to(roomName).emit("consultation:peer-left", {
                userId,
                socketId: socket.id
            });
            yield socket.leave(roomName);
            console.log(`[Consultation] ${userId} left ${roomName}`);
        }));
        // ========================================
        // CHAT EVENTS
        // ========================================
        socket.on("chat:join", (data) => {
            socket.join(`chat:${data.roomId}`);
            console.log(`[Chat] ${userId} joined chat:${data.roomId}`);
        });
        socket.on("chat:send_message", (data) => __awaiter(this, void 0, void 0, function* () {
            try {
                const chatService = new chat_service_1.ChatService();
                const message = yield chatService.sendMessage(userId, data.roomId, data.content);
                io.to(`chat:${data.roomId}`).emit("chat:receive_message", message);
            }
            catch (err) {
                socket.emit("error", err.message);
            }
        }));
        socket.on("chat:typing", (data) => {
            socket.to(`chat:${data.roomId}`).emit("chat:typing_status", {
                userId,
                isTyping: true,
            });
        });
        socket.on("chat:stop_typing", (data) => {
            socket.to(`chat:${data.roomId}`).emit("chat:typing_status", {
                userId,
                isTyping: false,
            });
        });
        socket.on("chat:mark_seen", (data) => __awaiter(this, void 0, void 0, function* () {
            try {
                const chatService = new chat_service_1.ChatService();
                yield chatService.markSeen(userId, data.roomId);
                socket.to(`chat:${data.roomId}`).emit("chat:message_seen", {
                    seenBy: userId,
                    roomId: data.roomId,
                    timestamp: new Date(),
                });
            }
            catch (err) {
                console.error("[Chat] mark_seen error:", err.message);
            }
        }));
        socket.on("chat:leave", (data) => {
            socket.leave(`chat:${data.roomId}`);
            console.log(`[Chat] ${userId} left chat:${data.roomId}`);
        });
        // ========================================
        // DISCONNECT
        // ========================================
        socket.on("disconnect", (reason) => {
            console.log(`[Socket] ❌ Disconnected: ${socket.id} | User: ${userId} | Reason: ${reason}`);
        });
    });
}
// Helper to extract user ID from populated or ObjectId
function extractUserId(field) {
    if (!field)
        return undefined;
    if (typeof field === 'string')
        return field;
    // If field has userId property (doctor profile), extract from there first
    if (field.userId) {
        if (typeof field.userId === 'string')
            return field.userId;
        if (field.userId._id)
            return field.userId._id.toString();
    }
    // Otherwise use _id directly (user object)
    if (field._id)
        return field._id.toString();
    return field.toString();
}
