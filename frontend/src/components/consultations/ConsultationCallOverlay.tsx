import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Phone, PhoneOff } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Remote video (full screen) */}
      <div className="flex-1 relative">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Call info overlay */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white px-4 py-2 rounded-lg">
          <div className="text-sm font-semibold">
            {isDoctor ? `Consulting with ${userName}` : `Consulting with Dr. ${doctorName}`}
          </div>
          <div className="text-xs text-gray-300">{formatDuration(callDuration)}</div>
        </div>

        {/* Local video (picture-in-picture) */}
        <div className="absolute bottom-20 right-4 w-32 h-40 bg-black rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {isLocalCameraOff && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-500" />
            </div>
          )}
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-gray-900 border-t border-gray-700 px-4 py-4 flex justify-center gap-4">
        {/* Mute button */}
        <button
          onClick={onToggleMute}
          className={`p-3 rounded-full transition-colors ${
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
          className={`p-3 rounded-full transition-colors ${
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
          className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
          title="End call"
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};
