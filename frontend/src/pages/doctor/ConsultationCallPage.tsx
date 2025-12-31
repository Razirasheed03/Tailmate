import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Loader, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { consultationService, type Consultation } from '@/services/consultationService';
import { useWebRTC } from '@/hooks/useWebRTC';
import { ConsultationCallOverlay } from '@/components/consultations/ConsultationCallOverlay';
import { useAuth } from '@/context/AuthContext';

export default function DoctorConsultationCallPage() {
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

  const {
    localStream,
    remoteStream,
    toggleAudio,
    toggleVideo,
    endCall,
  } = useWebRTC({
    videoRoomId: videoRoomId || '',
    consultationId: consultationId || '',
    isInitiator: true,
    onRemotePeerLeft: () => {
      console.log("[Doctor] Remote peer left");
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
        const data = await consultationService.getConsultation(consultationId);
        
        // Check if consultation is already completed
        if (data.status === 'completed') {
          const msg = 'This consultation has already been completed';
          setError(msg);
          toast.error(msg);
          setTimeout(() => navigate('/doctor/sessions', { replace: true }), 2000);
          return;
        }
        
        setConsultation(data);
        console.log("[Doctor] Consultation loaded");
      } catch (err) {
        console.error("[Doctor] Error initializing call:", err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to start call';
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
      console.log("[Doctor] Ending call...");
      endCall();
      if (consultationId) {
        console.log("[Doctor] Calling endCall API for consultation:", consultationId);
        await consultationService.endCall(consultationId);
        console.log("[Doctor] Call ended successfully");
        toast.success('Call ended successfully');
      }
      // Use replace: true to prevent back button returning to call page
      navigate('/doctor/sessions', { replace: true });
    } catch (err) {
      console.error("[Doctor] Error ending call:", err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to end call';
      setError(errorMsg);
      toast.error(errorMsg);
      // Still navigate away even if API call fails, but show error first
      setTimeout(() => {
        navigate('/doctor/sessions', { replace: true });
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

  // Safely extract user name
  const userName = consultation ? (
    typeof consultation.userId === 'object'
      ? (consultation.userId as any).username || 
        (consultation.userId as any).name || 
        'User'
      : 'User'
  ) : 'User';

  return (
    <ConsultationCallOverlay
      localStream={localStream}
      remoteStream={remoteStream}
      isLocalMuted={isAudioMuted}
      isLocalCameraOff={isVideoOff}
      doctorName={user?.username || 'Doctor'}
      userName={userName}
      isDoctor={true}
      onToggleMute={handleToggleMute}
      onToggleCamera={handleToggleCamera}
      onEndCall={handleEndCall}
    />
  );
}