import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Loader, AlertCircle } from 'lucide-react';
import { consultationService, type Consultation } from '@/services/consultationService';
import { useConsultationWebRTC } from '@/hooks/useConsultationWebRTC';
import { ConsultationCallOverlay } from '@/components/consultations/ConsultationCallOverlay';
import { IncomingCallModal } from '@/components/consultations/IncomingCallModal';
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
  const [callStarted, setCallStarted] = useState(false);

  // Extract doctor's USER ID from nested doctorId.userId (for WebRTC peer connection)
  const doctorUserId =
    consultation?.doctorId
      ? typeof consultation.doctorId === "object"
        ? typeof (consultation.doctorId as any).userId === "object"
          ? (consultation.doctorId as any).userId._id?.toString() || ""
          : (consultation.doctorId as any).userId?.toString() || ""
        : ""
      : "";

  console.log("[UserConsultationCallPage] IDs:", {
    localUserId: user?._id,
    doctorUserId,
    videoRoomId,
    consultationId,
  });

  const webRTC = useConsultationWebRTC({
    videoRoomId: videoRoomId || '',
    consultationId: consultationId || '',
    isDoctor: false,
    localUserId: user?._id || '',
    remoteUserId: doctorUserId,
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
        console.log("[Patient] Loading consultation:", consultationId);
        
        const data = await consultationService.getConsultation(consultationId);
        setConsultation(data);
        
        console.log("[Patient] Consultation loaded");
        console.log("LOCAL USER (Patient):", user?._id);
        console.log("REMOTE USER (Doctor):", data?.doctorId?.userId);

        if (!callStarted) {
          // Patient needs to call prepareCall to authorize themselves
          console.log("[Patient] Calling prepareCall...");
          await consultationService.prepareCall(consultationId);
          console.log("[Patient] PrepareCall successful");
          
          // CRITICAL: Patient MUST call startCall() to initialize WebRTC socket
          // This connects to Socket.IO and joins the video room
          // Patient will then wait for doctor's offer via socket events
          console.log("[Patient] Starting WebRTC (initializing socket and waiting for doctor)...");
          await webRTC.startCall();
          console.log("[Patient] WebRTC initialized - now listening for doctor's offer");
          
          setCallStarted(true);
        }
      } catch (err) {
        console.error("[Patient] Error initializing call:", err);
        setError(err instanceof Error ? err.message : 'Failed to load consultation');
      } finally {
        setLoading(false);
      }
    };

    initCall();
  }, [consultationId, videoRoomId, callStarted]);

  const handleAcceptCall = async () => {
    try {
      console.log("[Patient] Accepting call");
      await webRTC.acceptCall();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept call');
    }
  };

  const handleRejectCall = () => {
    console.log("[Patient] Rejecting call");
    webRTC.rejectCall();
    navigate('/consultations');
  };

  const handleEndCall = async () => {
    try {
      console.log("[Patient] Ending call");
      webRTC.endCall();
      if (consultationId) {
        await consultationService.endCall(consultationId);
      }
      navigate('/consultations');
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

  // Safely extract doctor info
  const doctorName = consultation ? (
    typeof consultation.doctorId === 'object'
      ? (consultation.doctorId as any)?.profile?.displayName || 
        (consultation.doctorId as any)?.name || 
        'Doctor'
      : 'Doctor'
  ) : 'Doctor';

  const doctorSpecialization = consultation ? (
    typeof consultation.doctorId === 'object'
      ? (consultation.doctorId as any)?.profile?.specialties?.[0] || 
        (consultation.doctorId as any)?.specialization || 
        ''
      : ''
  ) : '';

  // Show incoming call modal if receiving call
  if (webRTC.isReceivingCall) {
    console.log("[Patient] Showing incoming call modal");
    return (
      <IncomingCallModal
        doctorName={doctorName}
        doctorSpecialization={doctorSpecialization}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />
    );
  }

  // Show call overlay if in call
  if (webRTC.isInCall) {
    console.log("[Patient] In call, showing overlay");
    return (
      <ConsultationCallOverlay
        localStream={webRTC.localStream}
        remoteStream={webRTC.remoteStream}
        isLocalMuted={webRTC.isLocalMuted}
        isLocalCameraOff={webRTC.isLocalCameraOff}
        doctorName={doctorName}
        userName={user?.username || 'User'}
        isDoctor={false}
        onToggleMute={webRTC.toggleMute}
        onToggleCamera={webRTC.toggleCamera}
        onEndCall={handleEndCall}
      />
    );
  }

  // Waiting for call
  console.log("[Patient] Waiting state - WebRTC status:", {
    isInCall: webRTC.isInCall,
    isReceivingCall: webRTC.isReceivingCall,
    isCalling: webRTC.isCalling,
    localStream: !!webRTC.localStream,
    remoteStream: !!webRTC.remoteStream,
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
          
          {/* Debug info - remove in production */}
          <div className="mt-4 text-xs text-gray-400">
            <p>Socket: {webRTC.localStream ? 'Connected' : 'Connecting...'}</p>
            <p>Room: {videoRoomId?.slice(0, 15)}...</p>
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