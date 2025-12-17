import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { IConsultationService } from "../services/interfaces/consultation.service.interface";
import { IChatService } from "../services/interfaces/chat.service.interface";

interface AuthSocket extends Socket {
  userId?: string;
  username?: string;
}

export function initializeSocketServer(
  io: Server,
  consultationService: IConsultationService,
  chatService: IChatService
) {
  // Middleware: Authenticate ALL connections
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth.token || 
                  socket.handshake.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { 
        id: string; 
        username?: string; 
      };
      socket.userId = decoded.id;
      socket.username = decoded.username;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: AuthSocket) => {
    const userId = socket.userId!;
    console.log(`[Socket] ✅ Connected: ${socket.id} | User: ${userId}`);

    // ========================================
    // CONSULTATION / WEBRTC EVENTS
    // ========================================
    
    socket.on("consultation:join", async (data: { 
      consultationId: string; 
      videoRoomId: string 
    }) => {
      try {
        const consultation = await consultationService.getConsultation(data.consultationId);
        
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
        await socket.join(roomName);
        
        const roomSockets = await io.in(roomName).fetchSockets();
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
              userId: (s as any).userId,
            })),
        });
        
      } catch (err: any) {
        console.error("[Consultation] Join error:", err);
        socket.emit("consultation:error", { message: err.message });
      }
    });

    socket.on("consultation:signal", (data: {
      videoRoomId: string;
      targetSocketId?: string;
      signal: any;
    }) => {
      const roomName = `consultation:${data.videoRoomId}`;
      
      console.log(`[WebRTC] Signal from ${socket.id}:`, data.signal.type);
      
      if (data.targetSocketId) {
        io.to(data.targetSocketId).emit("consultation:signal", {
          fromSocketId: socket.id,
          fromUserId: userId,
          signal: data.signal,
        });
      } else {
        socket.to(roomName).emit("consultation:signal", {
          fromSocketId: socket.id,
          fromUserId: userId,
          signal: data.signal,
        });
      }
    });

    socket.on("consultation:leave", async (data: { videoRoomId: string }) => {
      const roomName = `consultation:${data.videoRoomId}`;
      socket.to(roomName).emit("consultation:peer-left", { 
        userId, 
        socketId: socket.id 
      });
      await socket.leave(roomName);
      console.log(`[Consultation] ${userId} left ${roomName}`);
    });

    // ========================================
    // CHAT EVENTS
    // ========================================
    
    socket.on("chat:join", async (data: { roomId: string }) => {
      await socket.join(`chat:${data.roomId}`);
      
      // Get current room members
      const roomSockets = await io.in(`chat:${data.roomId}`).fetchSockets();
      const memberIds = roomSockets.map(s => (s as any).userId);
      
      console.log(`[Chat] ✅ ${userId} joined chat:${data.roomId} | Room members: [${memberIds.join(', ')}]`);
    });

    socket.on("chat:send_message", async (data: { roomId: string; content: string }) => {
      try {
        console.log(`[Chat] 📤 ${userId} sending message to room ${data.roomId}`);
        
        // Ensure sender is in the room
        await socket.join(`chat:${data.roomId}`);
        
        const message = await chatService.sendMessage(userId, data.roomId, data.content);
        
        console.log(`[Chat] 📨 Broadcasting message ${message._id} to room chat:${data.roomId}`);
        
        // Get room members before broadcasting
        const roomSockets = await io.in(`chat:${data.roomId}`).fetchSockets();
        const memberIds = roomSockets.map(s => (s as any).userId);
        
        console.log(`[Chat] 👥 Room members who will receive: [${memberIds.join(', ')}]`);
        
        // Broadcast to ALL in room (sender will also receive via their own listener)
        io.to(`chat:${data.roomId}`).emit("chat:receive_message", message);
        
        console.log(`[Chat] ✅ Message broadcasted successfully`);
      } catch (err: any) {
        console.error(`[Chat] ❌ send_message error:`, err.message);
        socket.emit("error", err.message);
      }
    });

    socket.on("chat:typing", (data: { roomId: string }) => {
      socket.to(`chat:${data.roomId}`).emit("chat:typing_status", {
        userId,
        isTyping: true,
      });
    });

    socket.on("chat:stop_typing", (data: { roomId: string }) => {
      socket.to(`chat:${data.roomId}`).emit("chat:typing_status", {
        userId,
        isTyping: false,
      });
    });

    socket.on("chat:mark_seen", async (data: { roomId: string }) => {
      try {
        console.log(`[Chat] 👁️ ${userId} marking messages as seen in room ${data.roomId}`);
        
        const result = await chatService.markSeen(userId, data.roomId);
        
        console.log(`[Chat] 📊 Mark seen result: ${result.modifiedCount} messages updated`);
        
        // Get room members before broadcasting
        const roomSockets = await io.in(`chat:${data.roomId}`).fetchSockets();
        const memberIds = roomSockets.map(s => (s as any).userId);
        
        console.log(`[Chat] 👥 Broadcasting seen status to: [${memberIds.join(', ')}]`);
        
        // Broadcast to ALL in room (including the user who marked it)
        io.to(`chat:${data.roomId}`).emit("chat:message_seen", {
          seenBy: userId,
          roomId: data.roomId,
          timestamp: new Date(),
          modifiedCount: result.modifiedCount || 0,
        });
        
        console.log(`[Chat] ✅ Seen status broadcasted successfully`);
      } catch (err: any) {
        console.error("[Chat] ❌ mark_seen error:", err.message);
      }
    });

    socket.on("chat:leave", async (data: { roomId: string }) => {
      await socket.leave(`chat:${data.roomId}`);
      
      const roomSockets = await io.in(`chat:${data.roomId}`).fetchSockets();
      const remainingIds = roomSockets.map(s => (s as any).userId);
      
      console.log(`[Chat] 🚪 ${userId} left chat:${data.roomId} | Remaining: [${remainingIds.join(', ')}]`);
    });

    // ========================================
    // DISCONNECT
    // ========================================
    
    socket.on("disconnect", (reason) => {
      console.log(`[Socket] ❌ Disconnected: ${socket.id} | User: ${userId} | Reason: ${reason}`);
    });
  });
}

function extractUserId(field: any): string | undefined {
  if (!field) return undefined;
  if (typeof field === 'string') return field;
  
  if (field.userId) {
    if (typeof field.userId === 'string') return field.userId;
    if (field.userId._id) return field.userId._id.toString();
  }
  
  if (field._id) return field._id.toString();
  
  return field.toString();
}