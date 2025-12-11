import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface UseWebRTCProps {
  videoRoomId: string;
  consultationId: string;
  isInitiator: boolean;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionChange?: (state: RTCPeerConnectionState) => void;
  onRemotePeerLeft?: () => void;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export function useWebRTC({
  videoRoomId,
  consultationId,
  isInitiator,
  onRemoteStream,
  onConnectionChange,
  onRemotePeerLeft,
}: UseWebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [isReady, setIsReady] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const makingOfferRef = useRef(false);
  const isSettingRemoteAnswerPendingRef = useRef(false);
  
  // Prevent double initialization in React StrictMode
  const initialized = useRef(false);

  // ========================================
  // 1. INITIALIZE SOCKET (ONCE)
  // ========================================
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('[WebRTC] No auth token');
      return;
    }

    const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') || 
                       'http://localhost:4000';

    console.log('[WebRTC] Connecting to:', backendUrl);
    
    const socket = io(backendUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WebRTC] ✅ Socket connected:', socket.id);
      
      // Join consultation room
      socket.emit('consultation:join', { consultationId, videoRoomId });
    });

    socket.on('consultation:joined', (data) => {
      console.log('[WebRTC] ✅ Joined room:', data);
      setIsReady(true);
    });

    socket.on('consultation:peer-joined', (data) => {
      console.log('[WebRTC] 👥 Peer joined:', data);
      toast.success('User joined the call');
    });

    socket.on('consultation:error', (data) => {
      console.error('[WebRTC] ❌ Error:', data.message);
      toast.error(data.message || 'An error occurred');
    });

    socket.on('consultation:peer-left', (data) => {
      console.log('[WebRTC] 👋 Remote peer left:', data);
      setRemoteStream(null);
      onRemotePeerLeft?.();
      toast.info('The other user has left the call');
    });

    socket.on('consultation:call-ended', (data) => {
      console.log('[WebRTC] 📞 Doctor ended the call:', data);
      if (data.endedBy === 'doctor') {
        toast.warning('The doctor has ended the call');
      }
    });

    socket.on('disconnect', () => {
      console.log('[WebRTC] ❌ Socket disconnected');
      setIsReady(false);
    });

    return () => {
      console.log('[WebRTC] Cleanup: disconnecting socket');
      socket.disconnect();
      initialized.current = false;
    };
  }, []);

  // ========================================
  // 2. GET LOCAL MEDIA
  // ========================================
  useEffect(() => {
    if (!isReady) return;
    if (localStreamRef.current) return;

    let mounted = true;

    (async () => {
      try {
        console.log('[WebRTC] Requesting media...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });

        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        console.log('[WebRTC] ✅ Got local media');
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch (err) {
        console.error('[WebRTC] ❌ Media error:', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isReady]);

  // ========================================
  // 3. CREATE PEER CONNECTION (Perfect Negotiation Pattern)
  // ========================================
  useEffect(() => {
    console.log('[WebRTC] PC effect triggered', {
      isReady,
      hasLocalStream: !!localStreamRef.current,
      hasLocalStreamState: !!localStream,
      hasSocket: !!socketRef.current,
      hasPeerConnection: !!peerConnectionRef.current,
    });

    if (!isReady || !localStreamRef.current || !socketRef.current) {
      console.log('[WebRTC] ⏳ Waiting for: isReady=', isReady, ', hasLocalStream=', !!localStreamRef.current, ', hasSocket=', !!socketRef.current);
      return;
    }
    if (peerConnectionRef.current) {
      console.log('[WebRTC] PC already exists, skipping creation');
      return;
    }

    console.log('[WebRTC] ✅ Creating peer connection... (isInitiator:', isInitiator, ')');
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerConnectionRef.current = pc;
    console.log('[WebRTC] ✅ Peer connection created, adding tracks...');

    // ========================================
    // SETUP EVENT HANDLERS FIRST (before adding tracks)
    // ========================================

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log('[WebRTC] ✅ Received remote track:', event.track.kind);
      const [stream] = event.streams;
      if (stream) {
        console.log('[WebRTC] Setting remote stream');
        setRemoteStream(stream);
        onRemoteStream?.(stream);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] 📤 Sending ICE candidate');
        socketRef.current?.emit('consultation:signal', {
          videoRoomId,
          signal: { type: 'ice-candidate', candidate: event.candidate },
        });
      }
    };

    // Track connection state
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state changed:', pc.connectionState);
      setConnectionState(pc.connectionState);
      onConnectionChange?.(pc.connectionState);
    };

    // Track signaling state
    pc.onsignalingstatechange = () => {
      console.log('[WebRTC] Signaling state changed:', pc.signalingState);
    };

    // Perfect Negotiation - Handle negotiation needed (BEFORE adding tracks)
    pc.onnegotiationneeded = async () => {
      try {
        console.log('[WebRTC] onnegotiationneeded triggered (isInitiator:', isInitiator, ')');
        makingOfferRef.current = true;
        
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        console.log('[WebRTC] 📤 Sending offer');
        socketRef.current?.emit('consultation:signal', {
          videoRoomId,
          signal: { ...pc.localDescription!.toJSON(), type: 'offer' },
        });
      } catch (err) {
        console.error('[WebRTC] Negotiation error:', err);
      } finally {
        makingOfferRef.current = false;
      }
    };

    // ========================================
    // ADD LOCAL TRACKS (after handlers are set)
    // ========================================
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log('[WebRTC] Adding local track:', track.kind);
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Perfect Negotiation - Handle incoming signals
    const handleSignal = async (data: { 
      fromSocketId: string; 
      fromUserId: string;
      signal: any 
    }) => {
      try {
        const { signal } = data;
        console.log('[WebRTC] 📥 Received signal:', signal.type, '| Signaling state:', pc.signalingState);

        if (signal.type === 'offer') {
          const offerCollision = 
            makingOfferRef.current || pc.signalingState !== 'stable';

          const ignoreOffer = !isInitiator && offerCollision;
          if (ignoreOffer) {
            console.log('[WebRTC] ⚠️ Ignoring offer due to collision (isInitiator:', isInitiator, ', makingOffer:', makingOfferRef.current, ')');
            return;
          }

          console.log('[WebRTC] 📥 Processing offer...');
          isSettingRemoteAnswerPendingRef.current = true;
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          isSettingRemoteAnswerPendingRef.current = false;

          console.log('[WebRTC] 📤 Creating answer...');
          await pc.setLocalDescription();
          
          socketRef.current?.emit('consultation:signal', {
            videoRoomId,
            signal: { ...pc.localDescription!.toJSON(), type: 'answer' },
          });
        } else if (signal.type === 'answer') {
          console.log('[WebRTC] 📥 Processing answer...');
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.type === 'ice-candidate' && signal.candidate) {
          try {
            console.log('[WebRTC] 📥 Adding ICE candidate');
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (err) {
            if (!isSettingRemoteAnswerPendingRef.current) {
              console.error('[WebRTC] ICE candidate error:', err);
            }
          }
        }
      } catch (err) {
        console.error('[WebRTC] Signal handling error:', err);
      }
    };

    socketRef.current.on('consultation:signal', handleSignal);

    return () => {
      console.log('[WebRTC] Cleaning up peer connection');
      socketRef.current?.off('consultation:signal', handleSignal);
      pc.close();
      peerConnectionRef.current = null;
    };
  }, [isReady, localStream, videoRoomId, isInitiator]);

  // ========================================
  // CONTROLS
  // ========================================
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return true;
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return true;
  }, []);

  const endCall = useCallback(() => {
    socketRef.current?.emit('consultation:leave', { videoRoomId });
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  }, [videoRoomId]);

  return {
    localStream,
    remoteStream,
    connectionState,
    isReady,
    toggleAudio,
    toggleVideo,
    endCall,
  };
}
