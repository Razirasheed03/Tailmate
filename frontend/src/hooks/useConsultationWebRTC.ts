//hooks/useConsultationWebRTC.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseConsultationWebRTCProps {
  videoRoomId: string;
  consultationId: string;
  isDoctor?: boolean;
  localUserId?: string;
  remoteUserId?: string;
}

interface WebRTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCalling: boolean;
  isInCall: boolean;
  isReceivingCall: boolean;
  isLocalMuted: boolean;
  isLocalCameraOff: boolean;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:global.relay.metered.ca:80',
    username: import.meta.env.VITE_TURN_USER || 'openrelayproject',
    credential: import.meta.env.VITE_TURN_PASS || 'openrelayproject',
  },
];

export const useConsultationWebRTC = ({
  videoRoomId,
  consultationId,
  isDoctor,
  localUserId,
  remoteUserId,
}: UseConsultationWebRTCProps) => {
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<WebRTCState>({
    localStream: null,
    remoteStream: null,
    isCalling: false,
    isInCall: false,
    isReceivingCall: false,
    isLocalMuted: false,
    isLocalCameraOff: false,
  });

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socketRef.current = io(`${window.location.origin}/consultation`, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      console.log('WebRTC socket connected');
      socketRef.current?.emit('join_consultation_room', {
        consultationId,
        videoRoomId,
      });
    });

    socketRef.current.on('error', (error: string) => {
      console.error('Socket error:', error);
    });

    socketRef.current.on('disconnect', () => {
      console.log('WebRTC socket disconnected');
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [videoRoomId, consultationId]);

  // Setup WebRTC peer connection
  const setupPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      console.log('[WebRTC] Peer connection already exists, reusing');
      return peerConnectionRef.current;
    }

    console.log('[WebRTC] Creating new peer connection');
    const peerConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });

    // Add local stream tracks
    if (localStreamRef.current) {
      console.log('[WebRTC] Adding local stream tracks to peer connection');
      localStreamRef.current.getTracks().forEach((track) => {
        console.log('[WebRTC] Adding track:', track.kind);
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    } else {
      console.warn('[WebRTC] No local stream available to add tracks');
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      if (remoteStreamRef.current) {
        remoteStreamRef.current.addTrack(event.track);
      } else {
        remoteStreamRef.current = event.streams[0];
        setState((prev) => ({
          ...prev,
          remoteStream: event.streams[0],
        }));
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('webrtc_ice_candidate', {
          videoRoomId,
          candidate: event.candidate,
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      if (
        peerConnection.connectionState === 'failed' ||
        peerConnection.connectionState === 'disconnected'
      ) {
        setState((prev) => ({
          ...prev,
          isInCall: false,
        }));
      }
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }, [videoRoomId]);

  // Get local media
  const getLocalMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      localStreamRef.current = stream;
      setState((prev) => ({
        ...prev,
        localStream: stream,
      }));

      return stream;
    } catch (error) {
      console.error('Error getting local media:', error);
      throw error;
    }
  }, []);

  // Start call (for doctor)
  const startCall = useCallback(async () => {
    try {
      console.log('[WebRTC] Starting call...');
      setState((prev) => ({ ...prev, isCalling: true }));

      if (!localStreamRef.current) {
        console.log('[WebRTC] Getting local media');
        await getLocalMedia();
      }

      console.log('[WebRTC] Setting up peer connection');
      const peerConnection = setupPeerConnection();
      
      console.log('[WebRTC] Creating offer');
      const offer = await peerConnection.createOffer();
      
      console.log('[WebRTC] Setting local description');
      await peerConnection.setLocalDescription(offer);

      console.log('[WebRTC] Sending offer to remote peer');
      socketRef.current?.emit('webrtc_offer', {
        videoRoomId,
        offer,
      });

      setState((prev) => ({
        ...prev,
        isInCall: true,
      }));
      console.log('[WebRTC] Call started');
    } catch (error) {
      console.error('Error starting call:', error);
      setState((prev) => ({ ...prev, isCalling: false }));
      throw error;
    }
  }, [getLocalMedia, setupPeerConnection, videoRoomId]);

  // Accept call (for patient)
  const acceptCall = useCallback(async () => {
    try {
      if (!localStreamRef.current) {
        await getLocalMedia();
      }

      const peerConnection = setupPeerConnection();
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socketRef.current?.emit('webrtc_answer', {
        videoRoomId,
        answer,
      });

      setState((prev) => ({
        ...prev,
        isInCall: true,
        isReceivingCall: false,
      }));
    } catch (error) {
      console.error('Error accepting call:', error);
      throw error;
    }
  }, [getLocalMedia, setupPeerConnection, videoRoomId]);

  // Reject call
  const rejectCall = useCallback(() => {
    socketRef.current?.emit('reject_consultation_call', {
      videoRoomId,
    });

    setState((prev) => ({
      ...prev,
      isReceivingCall: false,
    }));
  }, [videoRoomId]);

  // End call
  const endCall = useCallback(() => {
    socketRef.current?.emit('end_consultation_call', {
      videoRoomId,
    });

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    remoteStreamRef.current = null;

    setState((prev) => ({
      ...prev,
      localStream: null,
      remoteStream: null,
      isInCall: false,
      isCalling: false,
      isReceivingCall: false,
    }));
  }, [videoRoomId]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });

      setState((prev) => ({
        ...prev,
        isLocalMuted: !prev.isLocalMuted,
      }));
    }
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });

      setState((prev) => ({
        ...prev,
        isLocalCameraOff: !prev.isLocalCameraOff,
      }));
    }
  }, []);

  // Listen for incoming offer
  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.on('webrtc_offer', async (data: any) => {
      try {
        console.log('[WebRTC] Received offer from remote peer');
        
        if (!localStreamRef.current) {
          console.log('[WebRTC] Getting local media before handling offer');
          await getLocalMedia();
        }

        // CRITICAL: Use setupPeerConnection to ensure we have the peer connection
        // with local stream already added
        const peerConnection = setupPeerConnection();
        console.log('[WebRTC] Setting remote description from offer');
        
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );

        console.log('[WebRTC] Creating answer');
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        console.log('[WebRTC] Sending answer');
        socketRef.current?.emit('webrtc_answer', {
          videoRoomId,
          answer,
        });

        setState((prev) => ({
          ...prev,
          isInCall: true,
          isReceivingCall: false,
        }));
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    socketRef.current.on('webrtc_answer', async (data: any) => {
      try {
        console.log('[WebRTC] Received answer from remote peer');
        if (peerConnectionRef.current) {
          console.log('[WebRTC] Setting remote description from answer');
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          console.log('[WebRTC] Answer set successfully');
        } else {
          console.warn('[WebRTC] No peer connection available for answer');
        }
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    });

    socketRef.current.on('webrtc_ice_candidate', async (data: any) => {
      try {
        if (peerConnectionRef.current && data.candidate) {
          console.log('[WebRTC] Adding ICE candidate');
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        }
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });

    socketRef.current.on('consultation_call_ended', () => {
      console.log('Remote user ended call');
      endCall();
    });

    socketRef.current.on('consultation_call_rejected', () => {
      console.log('Call was rejected');
      setState((prev) => ({
        ...prev,
        isCalling: false,
      }));
    });

    return () => {
      socketRef.current?.off('webrtc_offer');
      socketRef.current?.off('webrtc_answer');
      socketRef.current?.off('webrtc_ice_candidate');
      socketRef.current?.off('consultation_call_ended');
      socketRef.current?.off('consultation_call_rejected');
    };
  }, [videoRoomId, getLocalMedia, setupPeerConnection, endCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    ...state,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
  };
};
