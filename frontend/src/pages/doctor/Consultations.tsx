import { useEffect, useState } from 'react';
import { Calendar, Clock, AlertCircle, Loader, Phone } from 'lucide-react';
import { consultationService, type Consultation } from '@/services/consultationService';
import { useAuth } from '@/context/AuthContext';

export default function DoctorConsultationsPage() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConsultations();
    const interval = setInterval(fetchConsultations, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const data = await consultationService.getDoctorConsultations();
      setConsultations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load consultations');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCall = async (consultation: Consultation) => {
    try {
      // Prepare call and get videoRoomId
      const result = await consultationService.prepareCall(consultation._id);

      // Start the call
      await consultationService.startCall(consultation._id);

      // Navigate to call page
      window.location.href = `/doctor/consultations/${consultation._id}?room=${result.videoRoomId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start call');
    }
  };

  const isConsultationActive = (consultation: Consultation) => {
    if (consultation.status === 'cancelled' || consultation.status === 'completed') {
      return false;
    }

    const now = new Date();
    const scheduledTime = new Date(consultation.scheduledFor);
    const endTime = new Date(
      scheduledTime.getTime() + consultation.durationMinutes * 60000
    );
    const windowStart = new Date(scheduledTime.getTime() - 10 * 60000);
    const windowEnd = new Date(endTime.getTime() + 10 * 60000);

    return now >= windowStart && now <= windowEnd;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Consultations</h1>
          <p className="text-gray-600 mt-2">Manage your scheduled consultations with patients</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-semibold">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Consultations list */}
        {consultations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No consultations scheduled yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Consultations will appear here once patients book them
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {consultations.map((consultation) => {
              const isActive = isConsultationActive(consultation);
              const statusColor = {
                upcoming: 'bg-blue-50 border-blue-200',
                in_progress: 'bg-green-50 border-green-200',
                completed: 'bg-gray-50 border-gray-200',
                cancelled: 'bg-red-50 border-red-200',
              };

              const statusBadgeColor = {
                upcoming: 'bg-blue-100 text-blue-800',
                in_progress: 'bg-green-100 text-green-800',
                completed: 'bg-gray-100 text-gray-800',
                cancelled: 'bg-red-100 text-red-800',
              };

              return (
                <div
                  key={consultation._id}
                  className={`border rounded-lg p-6 ${statusColor[consultation.status]}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {consultation.userId.name}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            statusBadgeColor[consultation.status]
                          }`}
                        >
                          {consultation.status.charAt(0).toUpperCase() +
                            consultation.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {consultation.userId.phone}
                      </p>
                    </div>
                  </div>

                  {/* Consultation details */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(consultation.scheduledFor)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Clock className="w-4 h-4" />
                      <span>{consultation.durationMinutes} minutes</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {consultation.notes && (
                    <div className="mb-4 p-3 bg-white bg-opacity-50 rounded text-sm text-gray-700">
                      <p className="font-semibold mb-1">Patient Notes:</p>
                      <p>{consultation.notes}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    {isActive && consultation.status === 'upcoming' && (
                      <button
                        onClick={() => handleStartCall(consultation)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        Start Video Call
                      </button>
                    )}
                    {!isActive && consultation.status === 'upcoming' && (
                      <div className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">
                        Available 10 min before
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
