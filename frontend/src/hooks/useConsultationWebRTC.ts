//useConsultationWebRTC.ts
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
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export const useConsultationWebRTC = ({
  videoRoomId,
  consultationId,
  isDoctor = false,
  localUserId,
  remoteUserId,
}: UseConsultationWebRTCProps) => {
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  
  // StrictMode guards: prevent double initialization
  const socketInitializedRef = useRef(false);
  const peerConnectionInitializedRef = useRef(false);

  const [state, setState] = useState<WebRTCState>({
    localStream: null,
    remoteStream: null,
    isCalling: false,
    isInCall: false,
    isReceivingCall: false,
    isLocalMuted: false,
    isLocalCameraOff: false,
  });

  // Initialize socket connection - ONLY ONCE
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token || !videoRoomId || !consultationId) {
      return;
    }

    // Guard: prevent double initialization in StrictMode
    if (socketInitializedRef.current && socketRef.current) {
      return;  // Already initialized, skip
    }

    // Derive backend base URL
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
    const backendUrl = apiBase.replace(/\/api\/?$/, '');

    console.log(`[WebRTC] Initializing socket for ${isDoctor ? 'DOCTOR' : 'PATIENT'}`);

    socketRef.current = io(backendUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketInitializedRef.current = true;

    socketRef.current.on('connect', () => {
      console.log(`[WebRTC] ✅ Socket connected (${isDoctor ? 'DOCTOR' : 'PATIENT'}):`, socketRef.current?.id);
      socketRef.current?.emit('join_consultation_room', {
        consultationId,
        videoRoomId,
      });
    });

    socketRef.current.on('joined_room', () => {
      console.log('[WebRTC] ✅ Successfully joined room');
    });

    socketRef.current.on('user_joined', () => {
      console.log('[WebRTC] Other user joined');
    });

    socketRef.current.on('error', (error: string) => {
      console.error('[WebRTC] Socket error:', error);
    });

    socketRef.current.on('disconnect', () => {
      console.log('[WebRTC] Socket disconnected');
    });

    // No cleanup here - cleanup happens in the unmount useEffect
    return undefined;
  }, [videoRoomId, consultationId, isDoctor]);


  // Setup WebRTC peer connection - ONLY ONCE
  const setupPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    // Guard: prevent double initialization in StrictMode
    if (peerConnectionInitializedRef.current) {
      return peerConnectionRef.current || undefined;
    }

    console.log('[WebRTC] Creating new peer connection');
    const peerConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });

    peerConnectionInitializedRef.current = true;

    // Add local stream tracks
    if (localStreamRef.current) {
      console.log('[WebRTC] Adding local tracks to peer connection');
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('[WebRTC] ✅ Received remote track:', event.track.kind);
      
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        setState((prev) => ({
          ...prev,
          remoteStream: event.streams[0],
          isInCall: true,
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
      console.log('[WebRTC] Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        console.log('[WebRTC] ✅ Peer connection established!');
        setState((prev) => ({ ...prev, isInCall: true }));
      }
      if (
        peerConnection.connectionState === 'failed' ||
        peerConnection.connectionState === 'disconnected'
      ) {
        console.log('[WebRTC] ❌ Connection failed/disconnected');
        setState((prev) => ({ ...prev, isInCall: false }));
      }
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }, [videoRoomId]);

  // Get local media
  const getLocalMedia = useCallback(async () => {
    if (localStreamRef.current) {
      console.log('[WebRTC] Reusing existing local stream');
      return localStreamRef.current;
    }

    try {
      console.log('[WebRTC] Requesting user media...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      console.log('[WebRTC] ✅ Got local media:', stream.getTracks().map(t => t.kind));
      localStreamRef.current = stream;
      setState((prev) => ({
        ...prev,
        localStream: stream,
      }));

      return stream;
    } catch (error) {
      console.error('[WebRTC] ❌ Error getting local media:', error);
      throw error;
    }
  }, []);

  // Start call
  const startCall = useCallback(async () => {
    try {
      console.log(`[WebRTC] Starting call as ${isDoctor ? 'DOCTOR' : 'PATIENT'}`);
      
      await getLocalMedia();
      const peerConnection = setupPeerConnection();

      if (!peerConnection) {
        throw new Error('Failed to setup peer connection');
      }

      if (isDoctor) {
        setState((prev) => ({ ...prev, isCalling: true }));
        console.log('[WebRTC] Doctor creating offer...');
        
        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });

        await peerConnection.setLocalDescription(offer);
        console.log('[WebRTC] Offer created and sent');

        socketRef.current?.emit('webrtc_offer', {
          videoRoomId,
          offer,
        });

        setState((prev) => ({
          ...prev,
          isInCall: true,
          isCalling: false,
        }));
      } else {
        // PATIENT: setup peer connection and wait for doctor's offer
        console.log('[WebRTC] Patient ready - waiting for doctor\'s offer');
      }
    } catch (error) {
      console.error('[WebRTC] Error starting call:', error);
      setState((prev) => ({ ...prev, isCalling: false }));
      throw error;
    }
  }, [getLocalMedia, setupPeerConnection, videoRoomId, isDoctor]);

  // Accept call (for patient - creates answer)
  const acceptCall = useCallback(async () => {
    try {
      console.log('[WebRTC] Patient accepting call...');
      
      if (!localStreamRef.current) {
        await getLocalMedia();
      }

      const peerConnection = setupPeerConnection();
      if (!peerConnection) {
        throw new Error('Failed to setup peer connection');
      }

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      console.log('[WebRTC] Answer created and sent');

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
      console.error('[WebRTC] Error accepting call:', error);
      throw error;
    }
  }, [getLocalMedia, setupPeerConnection, videoRoomId]);

  // Reject call
  const rejectCall = useCallback(() => {
    console.log('[WebRTC] Rejecting call');
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
    console.log('[WebRTC] Ending call');
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

    setState({
      localStream: null,
      remoteStream: null,
      isInCall: false,
      isCalling: false,
      isReceivingCall: false,
      isLocalMuted: false,
      isLocalCameraOff: false,
    });
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

  // Listen for WebRTC signaling
  useEffect(() => {
    if (!socketRef.current) return;

    // Handle incoming offer (patient receives this)
    const handleOffer = async (data: any) => {
      try {
        console.log('[WebRTC] 📥 Received offer from doctor');
        
        if (!localStreamRef.current) {
          await getLocalMedia();
        }

        const peerConnection = setupPeerConnection();
        if (!peerConnection) {
          throw new Error('Failed to setup peer connection');
        }
        
        console.log('[WebRTC] Setting remote description (offer)');
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );

        console.log('[WebRTC] Creating answer...');
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        console.log('[WebRTC] Sending answer to doctor');
        socketRef.current?.emit('webrtc_answer', {
          videoRoomId,
          answer,
        });

        setState((prev) => ({
          ...prev,
          isReceivingCall: false,
          isInCall: true,
        }));
      } catch (error) {
        console.error('[WebRTC] Error handling offer:', error);
      }
    };

    // Handle incoming answer (doctor receives this)
    const handleAnswer = async (data: any) => {
      try {
        console.log('[WebRTC] 📥 Received answer from patient');
        if (peerConnectionRef.current) {
          console.log('[WebRTC] Setting remote description (answer)');
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          console.log('[WebRTC] ✅ Connection established');
        }
      } catch (error) {
        console.error('[WebRTC] Error handling answer:', error);
      }
    };

    // Handle ICE candidates
    const handleIceCandidate = async (data: any) => {
      try {
        if (peerConnectionRef.current && data.candidate) {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        }
      } catch (error) {
        console.error('[WebRTC] Error adding ICE candidate:', error);
      }
    };

    const handleCallEnded = () => {
      console.log('[WebRTC] Remote user ended call');
      endCall();
    };

    const handleCallRejected = () => {
      console.log('[WebRTC] Call was rejected');
      setState((prev) => ({
        ...prev,
        isCalling: false,
      }));
    };

    socketRef.current.on('webrtc_offer', handleOffer);
    socketRef.current.on('webrtc_answer', handleAnswer);
    socketRef.current.on('webrtc_ice_candidate', handleIceCandidate);
    socketRef.current.on('consultation_call_ended', handleCallEnded);
    socketRef.current.on('consultation_call_rejected', handleCallRejected);

    return () => {
      socketRef.current?.off('webrtc_offer', handleOffer);
      socketRef.current?.off('webrtc_answer', handleAnswer);
      socketRef.current?.off('webrtc_ice_candidate', handleIceCandidate);
      socketRef.current?.off('consultation_call_ended', handleCallEnded);
      socketRef.current?.off('consultation_call_rejected', handleCallRejected);
    };
  }, [videoRoomId, getLocalMedia, setupPeerConnection, endCall]);

  // Cleanup on unmount - disconnect socket and cleanup resources
  useEffect(() => {
    return () => {
      console.log('[WebRTC] Cleaning up on unmount');
      
      // End call and cleanup WebRTC
      endCall();
      
      // Disconnect socket only if it's actually connected
      // Don't disconnect during StrictMode cleanup if socket is still connecting
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.disconnect();
      }
      
      socketRef.current = null;
      socketInitializedRef.current = false;
      peerConnectionInitializedRef.current = false;
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