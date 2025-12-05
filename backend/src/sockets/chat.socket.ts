import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { ChatService } from "../services/implements/chat.service";

const chatService = new ChatService();

export function setupChatSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("Chat socket connected:", socket.id);

    // Extract userId from JWT token
    let userId: string | null = null;
    let activeRoomId: string | null = null;

    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        userId = decoded.id;
        console.log("Chat socket authenticated for user:", userId);
      } catch (err) {
        console.log("Chat socket auth failed:", err);
      }
    }

    // Join a room
    socket.on("join_room", (roomId: string) => {
      if (!userId) {
        socket.emit("error", "Unauthorized");
        return;
      }

      activeRoomId = roomId;
      socket.join(`room_${roomId}`);
      console.log(`User ${userId} joined room ${roomId}`);
      socket.emit("joined_room", { roomId, success: true });

      // Notify other user that messages are delivered
      socket.to(`room_${roomId}`).emit("delivered", {
        userId,
        roomId,
        timestamp: new Date(),
      });
    });

    // Send message
    socket.on("send_message", async (data: { roomId: string; content: string }) => {
      if (!userId) {
        socket.emit("error", "Unauthorized");
        return;
      }

      try {
        const message = await chatService.sendMessage(
          userId,
          data.roomId,
          data.content
        );

        // Emit to all users in the room
        io.to(`room_${data.roomId}`).emit("receive_message", {
          ...message,
          senderId: message.senderId,
        });
      } catch (err: any) {
        socket.emit("error", err.message);
      }
    });

    // Typing indicator
    socket.on("typing", (data: { roomId: string }) => {
      if (!userId) return;

      socket.to(`room_${data.roomId}`).emit("typing_status", {
        userId,
        isTyping: true,
      });
    });

    // Stop typing
    socket.on("stop_typing", (data: { roomId: string }) => {
      if (!userId) return;

      socket.to(`room_${data.roomId}`).emit("typing_status", {
        userId,
        isTyping: false,
      });
    });

    // Mark messages as seen
    socket.on("mark_seen", async (data: { roomId: string }) => {
      if (!userId) {
        console.log("mark_seen: No userId");
        return;
      }

      // STRICT: Only mark as seen if user is CURRENTLY in this room
      if (activeRoomId !== data.roomId) {
        console.log(`mark_seen: User ${userId} not in room ${data.roomId} (active: ${activeRoomId})`);
        return;
      }

      try {
        await chatService.markSeen(userId, data.roomId);

        // Emit ONLY to other users in the room (not back to sender)
        socket.to(`room_${data.roomId}`).emit("message_seen", {
          seenBy: userId,
          roomId: data.roomId,
          timestamp: new Date(),
        });
      } catch (err: any) {
        console.error("mark_seen error:", err.message);
      }
    });

    // Leave room
    socket.on("leave_room", (roomId: string) => {
      if (activeRoomId === roomId) {
        activeRoomId = null;
      }
      socket.leave(`room_${roomId}`);
      console.log(`User ${userId} left room ${roomId}`);
    });

    socket.on("disconnect", () => {
      console.log("Chat socket disconnected:", socket.id);
    });
  });
}
