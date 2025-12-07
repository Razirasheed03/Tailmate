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
    const token = localStorage.getItem('auth_token');
    if (!token || !videoRoomId) {
      console.error('[WebRTC] Missing token or videoRoomId');
      return;
    }

    console.log(`[WebRTC] Initializing socket for ${isDoctor ? 'DOCTOR' : 'PATIENT'}`);
    console.log(`[WebRTC] Connecting to /consultation namespace`);
    
    // Get backend URL from environment or use default
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    console.log(`[WebRTC] Backend URL: ${backendUrl}`);
    
    // Connect to the /consultation namespace
    socketRef.current = io(`${backendUrl}`, {
      auth: { token },
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      console.log(`[WebRTC] ✅ Socket connected for ${isDoctor ? 'DOCTOR' : 'PATIENT'}:`, socketRef.current?.id);
      socketRef.current?.emit('join_consultation_room', {
        consultationId,
        videoRoomId,
      });
    });

    socketRef.current.on('joined_room', (data: any) => {
      console.log('[WebRTC] ✅ Successfully joined room:', data);
    });

    socketRef.current.on('user_joined', (data: any) => {
      console.log('[WebRTC] Other user joined:', data);
    });

    socketRef.current.on('error', (error: string) => {
      console.error('[WebRTC] Socket error:', error);
    });

    socketRef.current.on('disconnect', () => {
      console.log('[WebRTC] Socket disconnected');
    });

    return () => {
      console.log('[WebRTC] Cleaning up socket');
      socketRef.current?.disconnect();
    };
  }, [videoRoomId, consultationId, isDoctor]);

  // Setup WebRTC peer connection
  const setupPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      console.log('[WebRTC] Reusing existing peer connection');
      return peerConnectionRef.current;
    }

    console.log('[WebRTC] Creating new peer connection');
    const peerConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });

    // Add local stream tracks
    if (localStreamRef.current) {
      console.log('[WebRTC] Adding local tracks to peer connection');
      localStreamRef.current.getTracks().forEach((track) => {
        console.log(`[WebRTC] Adding ${track.kind} track:`, track.id);
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('[WebRTC] ✅ Received remote track:', event.track.kind, event.track.id);
      console.log('[WebRTC] Remote streams:', event.streams);
      
      if (event.streams && event.streams[0]) {
        console.log('[WebRTC] Setting remote stream');
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
        console.log('[WebRTC] Sending ICE candidate');
        socketRef.current?.emit('webrtc_ice_candidate', {
          videoRoomId,
          candidate: event.candidate,
        });
      } else {
        console.log('[WebRTC] ICE gathering complete');
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

    peerConnection.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state:', peerConnection.iceConnectionState);
    };

    peerConnection.onicegatheringstatechange = () => {
      console.log('[WebRTC] ICE gathering state:', peerConnection.iceGatheringState);
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

  // Start call (for doctor - creates offer)
  const startCall = useCallback(async () => {
    try {
      console.log(`[WebRTC] Starting call as ${isDoctor ? 'DOCTOR (offer)' : 'PATIENT (wait)'}`);
      setState((prev) => ({ ...prev, isCalling: true }));

      // Get local media first
      await getLocalMedia();

      if (isDoctor) {
        // Doctor initiates the call
        console.log('[WebRTC] Doctor creating offer...');
        const peerConnection = setupPeerConnection();
        
        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        console.log('[WebRTC] Offer created');
        
        await peerConnection.setLocalDescription(offer);
        console.log('[WebRTC] Local description set');

        socketRef.current?.emit('webrtc_offer', {
          videoRoomId,
          offer,
        });
        console.log('[WebRTC] Offer sent to patient');

        setState((prev) => ({
          ...prev,
          isInCall: true,
          isCalling: false,
        }));
      } else {
        // Patient just waits for doctor's offer
        console.log('[WebRTC] Patient waiting for doctor to call...');
        setupPeerConnection(); // Setup but don't create offer
        setState((prev) => ({
          ...prev,
          isCalling: false,
        }));
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
      const answer = await peerConnection.createAnswer();
      console.log('[WebRTC] Answer created');
      
      await peerConnection.setLocalDescription(answer);
      console.log('[WebRTC] Local description set');

      socketRef.current?.emit('webrtc_answer', {
        videoRoomId,
        answer,
      });
      console.log('[WebRTC] Answer sent to doctor');

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
        console.log('[WebRTC] Received offer from doctor:', data.fromUserId);
        
        if (!localStreamRef.current) {
          await getLocalMedia();
        }

        const peerConnection = setupPeerConnection();
        
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
        console.log('[WebRTC] Received answer from patient:', data.fromUserId);
        if (peerConnectionRef.current) {
          console.log('[WebRTC] Setting remote description (answer)');
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          console.log('[WebRTC] ✅ Remote description set, connection should establish');
        }
      } catch (error) {
        console.error('[WebRTC] Error handling answer:', error);
      }
    };

    // Handle ICE candidates
    const handleIceCandidate = async (data: any) => {
      try {
        if (peerConnectionRef.current && data.candidate) {
          console.log('[WebRTC] Adding ICE candidate from:', data.fromUserId);
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

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