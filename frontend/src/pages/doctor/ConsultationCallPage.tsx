import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Loader, AlertCircle } from 'lucide-react';
import { consultationService, type Consultation } from '@/services/consultationService';
import { useConsultationWebRTC } from '@/hooks/useConsultationWebRTC';
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
  const [callStarted, setCallStarted] = useState(false);

  // Extract patient's USER ID (for WebRTC peer connection)
  // consultation.userId can be either a populated User object or just the ID string
  const patientUserId =
    consultation?.userId
      ? typeof consultation.userId === "object"
        ? (consultation.userId as any)._id
        : (consultation.userId as any).toString()
      : "";

  console.log("[DoctorConsultationCallPage] Extracted IDs:", {
    localUserId: user?._id,
    patientUserId: patientUserId,
    consultationUserId: consultation?.userId,
  });

  const webRTC = useConsultationWebRTC({
    videoRoomId: videoRoomId || '',
    consultationId: consultationId || '',
    isDoctor: true,
    localUserId: user?._id || '',
    remoteUserId: patientUserId || '',
  });

  useEffect(() => {
    if (!consultationId || !videoRoomId) {
      setError('Invalid consultation or room ID');
      setLoading(false);
      return;
    }

    const initCall = async () => {
      try {
        setLoading(true);
        const data = await consultationService.getConsultation(consultationId);
        setConsultation(data);
        console.log("LOCAL USER (Doctor):", user?._id);
        console.log("REMOTE USER (Patient):", data?.userId?._id);

        // Doctor needs to call prepareCall to authorize themselves
        if (!callStarted) {
          console.log("[Doctor] Calling prepareCall...");
          await consultationService.prepareCall(consultationId);
          console.log("[Doctor] PrepareCall successful");
          
          // Start the call
          await webRTC.startCall();
          setCallStarted(true);
        }
      } catch (err) {
        console.error("[Doctor] Error initializing call:", err);
        setError(err instanceof Error ? err.message : 'Failed to start call');
      } finally {
        setLoading(false);
      }
    };

    initCall();
  }, [consultationId, videoRoomId]);

  const handleEndCall = async () => {
    try {
      webRTC.endCall();
      if (consultationId) {
        await consultationService.endCall(consultationId);
      }
      navigate('/doctor/consultations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end call');
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
      localStream={webRTC.localStream}
      remoteStream={webRTC.remoteStream}
      isLocalMuted={webRTC.isLocalMuted}
      isLocalCameraOff={webRTC.isLocalCameraOff}
      doctorName={user?.username || 'Doctor'}
      userName={userName}
      isDoctor={true}
      onToggleMute={webRTC.toggleMute}
      onToggleCamera={webRTC.toggleCamera}
      onEndCall={handleEndCall}
    />
  );
}