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
const notification_schema_1 = require("../schema/notification.schema");
const mongoose_1 = require("mongoose");
function initializeSocketServer(io, consultationService, chatService) {
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
        socket.join(`user:${userId}`);
        // ========================================
        // CONSULTATION / WEBRTC EVENTS
        // ========================================
        socket.on("consultation:join", (data) => __awaiter(this, void 0, void 0, function* () {
            try {
                const consultation = yield consultationService.getConsultation(data.consultationId);
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
                socket.to(roomName).emit("consultation:peer-joined", {
                    userId,
                    isDoctor,
                    socketId: socket.id,
                });
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
        socket.on("consultation:signal", (data) => {
            const roomName = `consultation:${data.videoRoomId}`;
            console.log(`[WebRTC] Signal from ${socket.id}:`, data.signal.type);
            if (data.targetSocketId) {
                io.to(data.targetSocketId).emit("consultation:signal", {
                    fromSocketId: socket.id,
                    fromUserId: userId,
                    signal: data.signal,
                });
            }
            else {
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
        socket.on("chat:join", (data) => __awaiter(this, void 0, void 0, function* () {
            yield socket.join(`chat:${data.roomId}`);
            // Get current room members
            const roomSockets = yield io.in(`chat:${data.roomId}`).fetchSockets();
            const memberIds = roomSockets.map(s => s.userId);
            console.log(`[Chat] ✅ ${userId} joined chat:${data.roomId} | Room members: [${memberIds.join(', ')}]`);
        }));
        socket.on("chat:send_message", (data) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`[Chat] 📤 ${userId} sending message to room ${data.roomId}`);
                // Ensure sender is in the room
                yield socket.join(`chat:${data.roomId}`);
                const message = yield chatService.sendMessage(userId, data.roomId, data.content, data.type, data.attachments);
                console.log(`[Chat] 📨 Broadcasting message ${message._id} to room chat:${data.roomId}`);
                // Get room members before broadcasting
                const roomSockets = yield io.in(`chat:${data.roomId}`).fetchSockets();
                const memberIds = roomSockets.map(s => s.userId);
                console.log(`[Chat] 👥 Room members who will receive: [${memberIds.join(', ')}]`);
                // ✅ FIX: Convert ObjectIds to strings before broadcasting
                const messageToSend = {
                    _id: message._id.toString(),
                    roomId: message.roomId.toString(),
                    senderId: message.senderId.toString(), // ← CRITICAL FIX
                    content: message.content,
                    type: message.type,
                    attachments: message.attachments,
                    deliveredTo: (message.deliveredTo || []).map((id) => id.toString()),
                    seenBy: (message.seenBy || []).map((id) => id.toString()),
                    createdAt: message.createdAt,
                    updatedAt: message.updatedAt,
                };
                // Broadcast to ALL in room (sender will also receive via their own listener)
                io.to(`chat:${data.roomId}`).emit("chat:receive_message", messageToSend);
                console.log(`[Chat] ✅ Message broadcasted successfully`);
            }
            catch (err) {
                console.error(`[Chat] ❌ send_message error:`, err.message);
                socket.emit("error", err.message);
            }
        }));
        // Typing indicator
        socket.on("chat:typing", (data) => {
            const roomName = `chat:${data.roomId}`;
            socket.to(roomName).emit("chat:typing_status", {
                userId,
                isTyping: true,
                timestamp: new Date(),
            });
        });
        // Stop typing indicator
        socket.on("chat:stop_typing", (data) => {
            const roomName = `chat:${data.roomId}`;
            socket.to(roomName).emit("chat:typing_status", {
                userId,
                isTyping: false,
                timestamp: new Date(),
            });
        });
        // Mark messages as seen - ONLY when receiver explicitly opens/views the chat
        // This should ONLY be called by the receiver, not the sender
        socket.on("chat:mark_seen", (data) => __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`[Chat] 👁️ ${userId} marking messages as seen in room ${data.roomId}`);
                const result = yield chatService.markSeen(userId, data.roomId);
                console.log(`[Chat] 📊 Mark seen result: ${result.modifiedCount} messages updated`);
                // Get room members before broadcasting
                const roomSockets = yield io.in(`chat:${data.roomId}`).fetchSockets();
                const memberIds = roomSockets.map(s => s.userId);
                console.log(`[Chat] 👥 Broadcasting seen status to: [${memberIds.join(', ')}]`);
                // Broadcast to ALL in room (including the user who marked it)
                io.to(`chat:${data.roomId}`).emit("chat:message_seen", {
                    seenBy: userId,
                    roomId: data.roomId,
                    timestamp: new Date(),
                    modifiedCount: result.modifiedCount || 0,
                });
                console.log(`[Chat] ✅ Seen status broadcasted successfully`);
            }
            catch (err) {
                console.error("[Chat] ❌ mark_seen error:", err.message);
            }
        }));
        socket.on("chat:leave", (data) => __awaiter(this, void 0, void 0, function* () {
            yield socket.leave(`chat:${data.roomId}`);
            const roomSockets = yield io.in(`chat:${data.roomId}`).fetchSockets();
            const remainingIds = roomSockets.map(s => s.userId);
            console.log(`[Chat] 🚪 ${userId} left chat:${data.roomId} | Remaining: [${remainingIds.join(', ')}]`);
        }));
        // ========================================
        // DISCONNECT
        // ========================================
        socket.on("disconnect", (reason) => {
            console.log(`[Socket] ❌ Disconnected: ${socket.id} | User: ${userId} | Reason: ${reason}`);
        });
        // ========================================
        // NOTIFICATION EVENTS (Additive)
        // ========================================
        socket.on("notification:mark_seen", (data) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!(data === null || data === void 0 ? void 0 : data.notificationId) || !mongoose_1.Types.ObjectId.isValid(data.notificationId)) {
                    return;
                }
                const updated = yield notification_schema_1.NotificationModel.findOneAndUpdate({ _id: new mongoose_1.Types.ObjectId(data.notificationId), userId: new mongoose_1.Types.ObjectId(userId) }, { $set: { read: true } }, { new: true }).lean();
                if (!updated)
                    return;
                io.to(`user:${userId}`).emit("notification:mark_seen", {
                    notificationId: data.notificationId,
                });
            }
            catch (err) {
                console.error("[Notification] ❌ mark_seen error:", err.message);
            }
        }));
    });
}
function extractUserId(field) {
    if (!field)
        return undefined;
    if (typeof field === 'string')
        return field;
    if (field.userId) {
        if (typeof field.userId === 'string')
            return field.userId;
        if (field.userId._id)
            return field.userId._id.toString();
    }
    if (field._id)
        return field._id.toString();
    return field.toString();
}
