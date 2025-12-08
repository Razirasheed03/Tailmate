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
  // CRITICAL: Create /consultation namespace
  const consultationNamespace = io.of("/consultation");
  
  console.log("[WebRTC] ✅ Consultation namespace created at /consultation");

  consultationNamespace.on("connection", (socket: ConsultationSocket) => {
    console.log("[WebRTC] 🔌 New socket connected to /consultation:", socket.id);

    // ---- AUTH USING JWT ----
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

    // ---- JOIN CONSULTATION ROOM ----
    socket.on(
      "join_consultation_room",
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

          // Extract IDs properly (handles populated and plain ObjectIds)
          let doctorProfileId: string | undefined;
          let doctorUserId: string | undefined;
          let patientUserId: string | undefined;

          // Doctor side (profile + user)
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

          // Patient side (userId)
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
          socket.join(videoRoomId);

          console.log(
            `[WebRTC] ✅ User ${userId} (${isDoctor ? "DOCTOR" : "PATIENT"}) joined room ${videoRoomId}`
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

    // ---- WEBRTC OFFER ----
    socket.on(
      "webrtc_offer",
      (data: { videoRoomId: string; offer: RTCSessionDescriptionInit }) => {
        if (!userId) {
          socket.emit("error", "Unauthorized");
          return;
        }

        console.log(
          `[WebRTC] 📤 User ${userId} sending OFFER to room ${data.videoRoomId}`
        );
        socket.to(data.videoRoomId).emit("webrtc_offer", {
          fromUserId: userId,
          offer: data.offer,
        });
        console.log(`[WebRTC] ✅ Offer forwarded to room ${data.videoRoomId}`);
      }
    );

    // ---- WEBRTC ANSWER ----
    socket.on(
      "webrtc_answer",
      (data: { videoRoomId: string; answer: RTCSessionDescriptionInit }) => {
        if (!userId) {
          socket.emit("error", "Unauthorized");
          return;
        }

        console.log(
          `[WebRTC] 📤 User ${userId} sending ANSWER to room ${data.videoRoomId}`
        );
        socket.to(data.videoRoomId).emit("webrtc_answer", {
          fromUserId: userId,
          answer: data.answer,
        });
        console.log(`[WebRTC] ✅ Answer forwarded to room ${data.videoRoomId}`);
      }
    );

    // ---- ICE CANDIDATE ----
    socket.on(
      "webrtc_ice_candidate",
      (data: { videoRoomId: string; candidate: RTCIceCandidateInit }) => {
        if (!userId) {
          socket.emit("error", "Unauthorized");
          return;
        }

        console.log(
          `[WebRTC] 📤 User ${userId} sending ICE candidate to room ${data.videoRoomId}`
        );
        socket.to(data.videoRoomId).emit("webrtc_ice_candidate", {
          fromUserId: userId,
          candidate: data.candidate,
        });
      }
    );

    // ---- END CALL ----
    socket.on("end_consultation_call", (data: { videoRoomId: string }) => {
      if (!userId) {
        socket.emit("error", "Unauthorized");
        return;
      }

      console.log(
        `[WebRTC] User ${userId} ending call in room ${data.videoRoomId}`
      );
      socket.to(data.videoRoomId).emit("consultation_call_ended", {
        fromUserId: userId,
        timestamp: new Date(),
      });

      socket.leave(data.videoRoomId);
    });

    // ---- REJECT CALL ----
    socket.on("reject_consultation_call", (data: { videoRoomId: string }) => {
      if (!userId) {
        socket.emit("error", "Unauthorized");
        return;
      }

      console.log(
        `[WebRTC] User ${userId} rejecting call in room ${data.videoRoomId}`
      );
      socket.to(data.videoRoomId).emit("consultation_call_rejected", {
        fromUserId: userId,
        timestamp: new Date(),
      });

      socket.leave(data.videoRoomId);
    });

    // ---- DISCONNECT ----
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