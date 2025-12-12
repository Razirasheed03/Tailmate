import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { ChatService } from "../services/implements/chat.service";
import { ConsultationService } from "../services/implements/consultation.service";

interface AuthSocket extends Socket {
  userId?: string;
  username?: string;
}

export function initializeSocketServer(io: Server) {
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
        const consultationService = new ConsultationService();
        const consultation = await consultationService.getConsultation(data.consultationId);
        
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
        await socket.join(roomName);
        
        const roomSockets = await io.in(roomName).fetchSockets();
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
              userId: (s as any).userId,
            })),
        });
        
      } catch (err: any) {
        console.error("[Consultation] Join error:", err);
        socket.emit("consultation:error", { message: err.message });
      }
    });

    // WebRTC Signaling - Simple forwarding
    socket.on("consultation:signal", (data: {
      videoRoomId: string;
      targetSocketId?: string;
      signal: any;
    }) => {
      const roomName = `consultation:${data.videoRoomId}`;
      
      console.log(`[WebRTC] Signal from ${socket.id}:`, data.signal.type);
      
      if (data.targetSocketId) {
        // Send to specific peer
        io.to(data.targetSocketId).emit("consultation:signal", {
          fromSocketId: socket.id,
          fromUserId: userId,
          signal: data.signal,
        });
      } else {
        // Broadcast to room
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
    
    socket.on("chat:join", (data: { roomId: string }) => {
      socket.join(`chat:${data.roomId}`);
      console.log(`[Chat] ${userId} joined chat:${data.roomId}`);
    });

    socket.on("chat:send_message", async (data: { roomId: string; content: string }) => {
      try {
        const chatService = new ChatService();
        const message = await chatService.sendMessage(userId, data.roomId, data.content);
        io.to(`chat:${data.roomId}`).emit("chat:receive_message", message);
      } catch (err: any) {
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
        const chatService = new ChatService();
        await chatService.markSeen(userId, data.roomId);
        socket.to(`chat:${data.roomId}`).emit("chat:message_seen", {
          seenBy: userId,
          roomId: data.roomId,
          timestamp: new Date(),
        });
      } catch (err: any) {
        console.error("[Chat] mark_seen error:", err.message);
      }
    });

    socket.on("chat:leave", (data: { roomId: string }) => {
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
function extractUserId(field: any): string | undefined {
  if (!field) return undefined;
  if (typeof field === 'string') return field;
  
  // If field has userId property (doctor profile), extract from there first
  if (field.userId) {
    if (typeof field.userId === 'string') return field.userId;
    if (field.userId._id) return field.userId._id.toString();
  }
  
  // Otherwise use _id directly (user object)
  if (field._id) return field._id.toString();
  
  return field.toString();
}
