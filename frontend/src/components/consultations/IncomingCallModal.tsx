import { Phone, PhoneOff } from 'lucide-react';

interface IncomingCallModalProps {
  doctorName: string;
  doctorSpecialization?: string;
  onAccept: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  doctorName,
  doctorSpecialization,
  onAccept,
  onReject,
  isLoading = false,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Incoming Call</h2>
        </div>

        {/* Doctor info */}
        <div className="text-center mb-8">
          <p className="text-xl font-semibold text-gray-900">Dr. {doctorName}</p>
          {doctorSpecialization && (
            <p className="text-sm text-gray-600 mt-1">{doctorSpecialization}</p>
          )}
          <p className="text-sm text-gray-500 mt-3">Consultation call</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          {/* Reject button */}
          <button
            onClick={onReject}
            disabled={isLoading}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <PhoneOff className="w-5 h-5" />
            Reject
          </button>

          {/* Accept button */}
          <button
            onClick={onAccept}
            disabled={isLoading}
            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Phone className="w-5 h-5" />
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};
