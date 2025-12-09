import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { ConsultationService } from "../services/implements/consultation.service";

const consultationService = new ConsultationService();

interface ConsultationSocket extends Socket {
  userId?: string;
  consultationId?: string;
}

export function setupWebRTCConsultationSocket(io: Server) {
  // NO NAMESPACE - use the root connection
  io.on("connection", (socket: ConsultationSocket) => {
    console.log("[WebRTC] 🔌 New socket connected:", socket.id);

    let userId: string | null = null;

    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.split(" ")[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          id: string;
        };
        userId = decoded.id;
        socket.userId = userId;
        console.log("[WebRTC] ✅ Socket authenticated for user:", userId);
      } catch (err) {
        console.log("[WebRTC] ❌ Socket auth failed:", err);
        socket.emit("error", "Unauthorized");
        socket.disconnect();
        return;
      }
    } else {
      console.log("[WebRTC] ⚠️ No token provided for WebRTC");
      socket.emit("error", "No token provided");
      socket.disconnect();
      return;
    }

    socket.on(
      "consultation:join",
      async (data: { consultationId: string; videoRoomId: string }) => {
        try {
          if (!userId) {
            socket.emit("error", "Unauthorized");
            return;
          }

          const { consultationId, videoRoomId } = data;
          console.log(
            `[WebRTC] User ${userId} attempting to join room ${videoRoomId} for consultation ${consultationId}`
          );

          const consultation = await consultationService.getConsultation(
            consultationId
          );

          let doctorProfileId: string | undefined;
          let doctorUserId: string | undefined;
          let patientUserId: string | undefined;

          if (consultation.doctorId) {
            if (
              typeof consultation.doctorId === "object" &&
              consultation.doctorId !== null
            ) {
              const d: any = consultation.doctorId;
              doctorProfileId = d._id?.toString?.() ?? d.toString();
              if (d.userId) {
                if (typeof d.userId === "object" && d.userId !== null) {
                  doctorUserId = d.userId._id?.toString?.() ?? d.userId.toString();
                } else {
                  doctorUserId = d.userId.toString();
                }
              }
            } else {
              doctorProfileId = consultation.doctorId.toString();
            }
          }

          if (consultation.userId) {
            if (
              typeof consultation.userId === "object" &&
              consultation.userId !== null
            ) {
              const u: any = consultation.userId;
              patientUserId = u._id?.toString?.() ?? u.toString();
            } else {
              patientUserId = consultation.userId.toString();
            }
          }

          const isDoctor = doctorUserId === userId;
          const isPatient = patientUserId === userId;

          console.log("[WebRTC] Authorization check:", {
            userId,
            doctorProfileId,
            doctorUserId,
            patientUserId,
            isDoctor,
            isPatient,
          });

          if (!isDoctor && !isPatient) {
            console.log(
              `[WebRTC] ❌ User ${userId} not part of consultation ${consultationId}`
            );
            socket.emit("error", "Unauthorized - not part of this consultation");
            return;
          }

          if (consultation.videoRoomId !== videoRoomId) {
            console.log(
              `[WebRTC] ❌ Invalid videoRoomId: client=${videoRoomId}, db=${consultation.videoRoomId}`
            );
            socket.emit("error", "Invalid videoRoomId");
            return;
          }

          socket.consultationId = consultationId;
          const consultationRoom = `consultation-${videoRoomId}`;
          socket.join(consultationRoom);

          console.log('[WebRTC] ✅ Socket joined room:', {
            socketId: socket.id,
            userId,
            room: consultationRoom,
            roomMembers: Array.from(io.sockets.adapter.rooms.get(consultationRoom) || [])
          });

          socket.to(consultationRoom).emit("consultation:user-joined", {
            userId,
            isDoctor,
            isPatient,
            timestamp: new Date(),
          });

          socket.emit("consultation:joined", {
            videoRoomId,
            consultationId,
            success: true,
          });
        } catch (err: any) {
          console.error("[WebRTC] Error joining consultation room:", err);
          socket.emit("error", err.message || "Failed to join room");
        }
      }
    );

    socket.on(
      "consultation:webrtc-offer",
      (data: { videoRoomId: string; offer: RTCSessionDescriptionInit }) => {
        console.log("[WebRTC] 📥 Received consultation:webrtc-offer event");
        console.log("[WebRTC] Socket ID:", socket.id);
        console.log("[WebRTC] Socket rooms:", socket.rooms);
        console.log("[WebRTC] Data:", { videoRoomId: data.videoRoomId, hasOffer: !!data.offer });
        
        if (!userId) {
          console.log("[WebRTC] ❌ Offer rejected - no userId");
          socket.emit("error", "Unauthorized");
          return;
        }

        const consultationRoom = `consultation-${data.videoRoomId}`;
        console.log('[WebRTC] 📤 Emitting offer:', {
          fromUser: userId,
          socketId: socket.id,
          toRoom: consultationRoom,
          roomMembers: Array.from(io.sockets.adapter.rooms.get(consultationRoom) || [])
        });
        
        socket.to(consultationRoom).emit("consultation:webrtc-offer", {
          fromUserId: userId,
          offer: data.offer,
        });
        console.log(`[WebRTC] ✅ Offer forwarded to room ${consultationRoom}`);
      }
    );

    socket.on(
      "consultation:webrtc-answer",
      (data: { videoRoomId: string; answer: RTCSessionDescriptionInit }) => {
        console.log("[WebRTC] 📥 Received consultation:webrtc-answer event");
        console.log("[WebRTC] Answer data:", { videoRoomId: data.videoRoomId, hasAnswer: !!data.answer });
        
        if (!userId) {
          console.log("[WebRTC] ❌ Answer rejected - no userId");
          socket.emit("error", "Unauthorized");
          return;
        }

        const consultationRoom = `consultation-${data.videoRoomId}`;
        console.log('[WebRTC] 📤 Emitting answer:', {
          fromUser: userId,
          socketId: socket.id,
          toRoom: consultationRoom,
        });
        
        socket.to(consultationRoom).emit("consultation:webrtc-answer", {
          fromUserId: userId,
          answer: data.answer,
        });
        console.log(`[WebRTC] ✅ Answer forwarded to room ${consultationRoom}`);
      }
    );

    socket.on(
      "consultation:webrtc-ice-candidate",
      (data: { videoRoomId: string; candidate: RTCIceCandidateInit }) => {
        console.log("[WebRTC] 📥 Received consultation:webrtc-ice-candidate event");
        console.log("[WebRTC] ICE candidate data:", { videoRoomId: data.videoRoomId, hasCandidate: !!data.candidate });
        
        if (!userId) {
          console.log("[WebRTC] ❌ ICE candidate rejected - no userId");
          socket.emit("error", "Unauthorized");
          return;
        }

        const consultationRoom = `consultation-${data.videoRoomId}`;
        socket.to(consultationRoom).emit("consultation:webrtc-ice-candidate", {
          fromUserId: userId,
          candidate: data.candidate,
        });
        console.log(`[WebRTC] ✅ ICE candidate forwarded to room ${consultationRoom}`);
      }
    );

    socket.on("consultation:end", (data: { videoRoomId: string }) => {
      if (!userId) {
        socket.emit("error", "Unauthorized");
        return;
      }

      const consultationRoom = `consultation-${data.videoRoomId}`;
      console.log(
        `[WebRTC] User ${userId} ending call in room ${consultationRoom}`
      );
      socket.to(consultationRoom).emit("consultation:call-ended", {
        fromUserId: userId,
        timestamp: new Date(),
      });

      socket.leave(consultationRoom);
    });

    socket.on("consultation:reject", (data: { videoRoomId: string }) => {
      if (!userId) {
        socket.emit("error", "Unauthorized");
        return;
      }

      const consultationRoom = `consultation-${data.videoRoomId}`;
      console.log(
        `[WebRTC] User ${userId} rejecting call in room ${consultationRoom}`
      );
      socket.to(consultationRoom).emit("consultation:call-rejected", {
        fromUserId: userId,
        timestamp: new Date(),
      });

      socket.leave(consultationRoom);
    });

    socket.on("disconnect", () => {
      console.log("[WebRTC] Socket disconnected:", socket.id, "user:", userId);
      if (socket.consultationId) {
        socket.broadcast.emit("user_left", {
          userId,
          timestamp: new Date(),
        });
      }
    });
  });
}