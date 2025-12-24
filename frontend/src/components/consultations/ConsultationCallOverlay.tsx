import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff,PhoneOff } from 'lucide-react';

interface ConsultationCallOverlayProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isLocalMuted: boolean;
  isLocalCameraOff: boolean;
  doctorName: string;
  userName: string;
  isDoctor: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
}

export const ConsultationCallOverlay: React.FC<ConsultationCallOverlayProps> = ({
  localStream,
  remoteStream,
  isLocalMuted,
  isLocalCameraOff,
  doctorName,
  userName,
  isDoctor,
  onToggleMute,
  onToggleCamera,
  onEndCall,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isSelfViewPrimary, setIsSelfViewPrimary] = useState(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSwapVideos = () => {
    setIsSelfViewPrimary(!isSelfViewPrimary);
  };

  // Determine which stream goes where based on swap state
  const mainVideoRef = isSelfViewPrimary ? localVideoRef : remoteVideoRef;
  const miniVideoRef = isSelfViewPrimary ? remoteVideoRef : localVideoRef;
  // const mainStream = isSelfViewPrimary ? localStream : remoteStream;
  // const miniStream = isSelfViewPrimary ? remoteStream : localStream;
  const miniLabel = isSelfViewPrimary ? 'Doctor' : 'You';

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden">
      {/* Video Container - Takes all available space minus control bar */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        {/* Main video (full screen) - Tap to swap */}
        <video
          ref={mainVideoRef}
          autoPlay
          playsInline
          muted={isSelfViewPrimary}
          onClick={handleSwapVideos}
          className="absolute inset-0 w-full h-full object-cover cursor-pointer transition-opacity hover:opacity-90"
        />

        {/* Call info overlay */}
        <div className="absolute top-4 left-4 z-20 bg-black bg-opacity-60 text-white px-4 py-2 rounded-lg pointer-events-none">
          <div className="text-sm font-semibold">
            {isDoctor ? `Consulting with ${userName}` : `Consulting with Dr. ${doctorName}`}
          </div>
          <div className="text-xs text-gray-300">{formatDuration(callDuration)}</div>
        </div>

        {/* Mini video (picture-in-picture) - Tap to swap */}
        <div 
          onClick={handleSwapVideos}
          className="absolute bottom-24 right-4 z-10 w-32 h-40 bg-black rounded-lg overflow-hidden border-2 border-white shadow-lg cursor-pointer hover:border-blue-400 transition-colors"
          title="Tap to swap videos"
        >
          <video
            ref={miniVideoRef}
            autoPlay
            playsInline
            muted={!isSelfViewPrimary}
            className="w-full h-full object-cover"
          />

          {!isSelfViewPrimary && isLocalCameraOff && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-500" />
            </div>
          )}

          {isSelfViewPrimary && !remoteStream && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <p className="text-xs">Waiting for</p>
                <p className="text-xs font-semibold">{miniLabel}</p>
              </div>
            </div>
          )}

          {/* Mini video label */}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded pointer-events-none">
            {miniLabel}
          </div>
        </div>
      </div>

      {/* Control bar - Fixed at bottom, always visible and clickable */}
      <div className="relative z-30 bg-gray-900 border-t border-gray-700 px-4 py-4 flex justify-center gap-4 pointer-events-auto">
        {/* Mute button */}
        <button
          onClick={onToggleMute}
          className={`p-3 rounded-full transition-colors cursor-pointer ${
            isLocalMuted
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isLocalMuted ? 'Unmute' : 'Mute'}
        >
          {isLocalMuted ? (
            <MicOff className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
        </button>

        {/* Camera button */}
        <button
          onClick={onToggleCamera}
          className={`p-3 rounded-full transition-colors cursor-pointer ${
            isLocalCameraOff
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isLocalCameraOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isLocalCameraOff ? (
            <VideoOff className="w-6 h-6 text-white" />
          ) : (
            <Video className="w-6 h-6 text-white" />
          )}
        </button>

        {/* End call button */}
        <button
          onClick={onEndCall}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors cursor-pointer"
          title="End call"
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};
