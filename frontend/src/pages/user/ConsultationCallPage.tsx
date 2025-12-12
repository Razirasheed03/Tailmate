import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Loader, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { consultationService, type Consultation } from '@/services/consultationService';
import { useWebRTC } from '@/hooks/useWebRTC';
import { ConsultationCallOverlay } from '@/components/consultations/ConsultationCallOverlay';
import { useAuth } from '@/context/AuthContext';

export default function UserConsultationCallPage() {
  const { id: consultationId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const videoRoomId = searchParams.get('room');
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const [showRejoinButton, setShowRejoinButton] = useState(false);

  const {
    localStream,
    remoteStream,
    connectionState,
    isReady,
    toggleAudio,
    toggleVideo,
    endCall,
  } = useWebRTC({
    videoRoomId: videoRoomId || '',
    consultationId: consultationId || '',
    isInitiator: false,
    onRemotePeerLeft: () => {
      console.log("[Patient] Remote peer (doctor) left");
      setShowRejoinButton(true);
    },
  });

  const handleToggleMute = () => {
    const newState = toggleAudio();
    setIsAudioMuted(!newState);
  };

  const handleToggleCamera = () => {
    const newState = toggleVideo();
    setIsVideoOff(!newState);
  };

  useEffect(() => {
    if (!consultationId || !videoRoomId) {
      const msg = 'Invalid consultation or room ID';
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    const initCall = async () => {
      try {
        setLoading(true);
        console.log("[Patient] Loading consultation:", consultationId);
        
        const data = await consultationService.getConsultation(consultationId);
        
        // Check if consultation is already completed
        if (data.status === 'completed') {
          const msg = 'This consultation has already been completed. You cannot rejoin.';
          setError(msg);
          toast.error(msg);
          setTimeout(() => navigate('/consultations', { replace: true }), 2000);
          return;
        }
        
        setConsultation(data);
        console.log("[Patient] Consultation loaded");
      } catch (err) {
        console.error("[Patient] Error initializing call:", err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to load consultation';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    initCall();
  }, [consultationId, videoRoomId, navigate]);

  const handleEndCall = async () => {
    try {
      console.log("[Patient] Leaving call...");
      endCall();
      // Patient leaving - just disconnect locally, don't mark consultation as ended
      // Only doctor can end the consultation
      toast.info('You have left the call. The doctor can still end the consultation.');
      // Use replace: true to prevent back button returning to call page
      navigate('/consultations', { replace: true });
    } catch (err) {
      console.error("[Patient] Error leaving call:", err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to leave call';
      setError(errorMsg);
      toast.error(errorMsg);
      // Still navigate away even if there's an error
      setTimeout(() => {
        navigate('/consultations', { replace: true });
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-sm">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-semibold">Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Consultation not found</p>
      </div>
    );
  }

  // Safely extract doctor info
  const doctorName = consultation ? (
    typeof consultation.doctorId === 'object'
      ? (consultation.doctorId as any)?.profile?.displayName || 
        (consultation.doctorId as any)?.name || 
        'Doctor'
      : 'Doctor'
  ) : 'Doctor';

  // Show call overlay if connected
  if (remoteStream && connectionState === 'connected') {
    console.log("[Patient] In call, showing overlay");
    return (
      <ConsultationCallOverlay
        localStream={localStream}
        remoteStream={remoteStream}
        isLocalMuted={isAudioMuted}
        isLocalCameraOff={isVideoOff}
        doctorName={doctorName}
        userName={user?.username || 'User'}
        isDoctor={false}
        onToggleMute={handleToggleMute}
        onToggleCamera={handleToggleCamera}
        onEndCall={handleEndCall}
      />
    );
  }

  // Waiting for call
  console.log("[Patient] Waiting state - Connection:", {
    connectionState,
    hasLocalStream: !!localStream,
    hasRemoteStream: !!remoteStream,
    isReady,
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full mx-4">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Waiting for Dr. {doctorName}
          </h2>
          <p className="text-gray-600 text-sm">
            The doctor will connect to the call shortly
          </p>
          
          {/* Debug info */}
          <div className="mt-4 text-xs text-gray-400">
            <p>Socket: {isReady ? 'Connected' : 'Connecting...'}</p>
            <p>Room: {videoRoomId?.slice(0, 15)}...</p>
            <p>State: {connectionState}</p>
          </div>
          
          <button
            onClick={() => navigate('/consultations')}
            className="mt-6 px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}