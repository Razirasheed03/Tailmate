//webrtc.consultation.ts
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { ConsultationService } from "../services/implements/consultation.service";

const consultationService = new ConsultationService();

interface ConsultationSocket extends Socket {
  userId?: string;
  consultationId?: string;
}

export function setupWebRTCConsultationSocket(io: Server) {
  const consultationNamespace = io.of("/consultation");
  
  console.log("[WebRTC] Consultation namespace created at /consultation");

  consultationNamespace.on("connection", (socket: ConsultationSocket) => {
    console.log("[WebRTC] ✅ Socket connected to /consultation namespace:", socket.id);

    // Extract userId from JWT token
    let userId: string | null = null;

    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          id: string;
        };
        userId = decoded.id;
        socket.userId = userId;
        console.log("[WebRTC] Socket authenticated for user:", userId);
      } catch (err) {
        console.log("[WebRTC] Socket auth failed:", err);
        socket.emit("error", "Unauthorized");
        socket.disconnect();
        return;
      }
    } else {
      console.log("[WebRTC] No token provided");
      socket.emit("error", "No token provided");
      socket.disconnect();
      return;
    }

    // Join consultation room
    socket.on(
      "join_consultation_room",
      async (data: { consultationId: string; videoRoomId: string }) => {
        try {
          if (!userId) {
            socket.emit("error", "Unauthorized");
            return;
          }

          const { consultationId, videoRoomId } = data;
          console.log(`[WebRTC] User ${userId} attempting to join room ${videoRoomId}`);

          // Validate consultation exists and user has access
          const consultation = await consultationService.getConsultation(
            consultationId
          );

          // Extract IDs properly (handle both populated objects and raw ObjectIds)
          let doctorIdStr: string | undefined;
          let doctorUserIdStr: string | undefined;
          let userIdStr: string | undefined;

          // Extract doctor profile ID and doctor's user ID
          if (typeof consultation.doctorId === 'object' && consultation.doctorId !== null) {
            doctorIdStr = (consultation.doctorId as any)._id?.toString() || consultation.doctorId.toString();
            
            // Also get doctor's userId for comparison
            if ((consultation.doctorId as any).userId) {
              if (typeof (consultation.doctorId as any).userId === 'object') {
                doctorUserIdStr = ((consultation.doctorId as any).userId as any)._id?.toString();
              } else {
                doctorUserIdStr = (consultation.doctorId as any).userId?.toString();
              }
            }
          } else if (consultation.doctorId) {
            doctorIdStr = consultation.doctorId.toString();
          }

          // Extract patient user ID
          if (typeof consultation.userId === 'object' && consultation.userId !== null) {
            userIdStr = (consultation.userId as any)._id?.toString() || consultation.userId.toString();
          } else if (consultation.userId) {
            userIdStr = consultation.userId.toString();
          }

          const isDoctor = doctorUserIdStr === userId; // Compare with doctor's USER id
          const isPatient = userIdStr === userId;

          console.log(`[WebRTC] Authorization check:`, {
            userId,
            doctorUserIdStr,
            userIdStr,
            isDoctor,
            isPatient,
          });

          if (!isDoctor && !isPatient) {
            console.log(`[WebRTC] ❌ User ${userId} not authorized for consultation ${consultationId}`);
            socket.emit("error", "Unauthorized - not part of this consultation");
            return;
          }

          if (consultation.videoRoomId !== videoRoomId) {
            console.log(`[WebRTC] ❌ Invalid videoRoomId: ${videoRoomId} vs ${consultation.videoRoomId}`);
            socket.emit("error", "Invalid videoRoomId");
            return;
          }

          socket.consultationId = consultationId;
          socket.join(videoRoomId);

          console.log(
            `[WebRTC] ✅ User ${userId} (${isDoctor ? 'DOCTOR' : 'PATIENT'}) joined room ${videoRoomId}`
          );

          // Notify others in room
          socket.to(videoRoomId).emit("user_joined", {
            userId,
            isDoctor,
            isPatient,
            timestamp: new Date(),
          });

          socket.emit("joined_room", {
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

    // WebRTC Offer
    socket.on(
      "webrtc_offer",
      (data: { videoRoomId: string; offer: RTCSessionDescriptionInit }) => {
        if (!userId) {
          socket.emit("error", "Unauthorized");
          return;
        }

        console.log(`[WebRTC] User ${userId} sending offer to room ${data.videoRoomId}`);
        socket.to(data.videoRoomId).emit("webrtc_offer", {
          fromUserId: userId,
          offer: data.offer,
        });
      }
    );

    // WebRTC Answer
    socket.on(
      "webrtc_answer",
      (data: { videoRoomId: string; answer: RTCSessionDescriptionInit }) => {
        if (!userId) {
          socket.emit("error", "Unauthorized");
          return;
        }

        console.log(`[WebRTC] User ${userId} sending answer to room ${data.videoRoomId}`);
        socket.to(data.videoRoomId).emit("webrtc_answer", {
          fromUserId: userId,
          answer: data.answer,
        });
      }
    );

    // ICE Candidate
    socket.on(
      "webrtc_ice_candidate",
      (data: {
        videoRoomId: string;
        candidate: RTCIceCandidateInit;
      }) => {
        if (!userId) {
          socket.emit("error", "Unauthorized");
          return;
        }

        console.log(`[WebRTC] User ${userId} sending ICE candidate to room ${data.videoRoomId}`);
        socket.to(data.videoRoomId).emit("webrtc_ice_candidate", {
          fromUserId: userId,
          candidate: data.candidate,
        });
      }
    );

    // End call
    socket.on("end_consultation_call", (data: { videoRoomId: string }) => {
      if (!userId) {
        socket.emit("error", "Unauthorized");
        return;
      }

      console.log(`[WebRTC] User ${userId} ending call in ${data.videoRoomId}`);
      socket.to(data.videoRoomId).emit("consultation_call_ended", {
        fromUserId: userId,
        timestamp: new Date(),
      });

      socket.leave(data.videoRoomId);
    });

    // Reject call
    socket.on("reject_consultation_call", (data: { videoRoomId: string }) => {
      if (!userId) {
        socket.emit("error", "Unauthorized");
        return;
      }

      console.log(`[WebRTC] User ${userId} rejecting call in ${data.videoRoomId}`);
      socket.to(data.videoRoomId).emit("consultation_call_rejected", {
        fromUserId: userId,
        timestamp: new Date(),
      });

      socket.leave(data.videoRoomId);
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("[WebRTC] Socket disconnected:", socket.id, "user:", userId);
      if (socket.consultationId) {
        // Notify others that user left
        socket.broadcast.emit("user_left", {
          userId,
          timestamp: new Date(),
        });
      }
    });
  });
}