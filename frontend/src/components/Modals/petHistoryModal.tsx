// src/components/Modals/PetHistoryModal.tsx
import { useEffect, useState } from 'react';
import { getPetHistory } from '@/services/petsApiService';
import { Button } from '@/components/UiComponents/button';
import { X, Calendar, User, Clock, Package } from 'lucide-react';
import { toast } from 'sonner';

interface PetHistoryModalProps {
  petId: string;
  petName: string;
  open: boolean;
  onClose: () => void;
}

interface HistoryEvent {
  at: string;
  action: string;
  by: {
    _id: string;
    name: string;
    email?: string;
    profilePhoto?: string;
  };
  meta?: any;
}

interface PetData {
  _id: string;
  name: string;
  speciesCategoryName: string;
  sex: string;
  birthDate?: string;
  photoUrl?: string;
  userId: {
    _id: string;
    name: string;
    email?: string;
    profilePhoto?: string;
  };
  currentOwnerId: {
    _id: string;
    name: string;
    email?: string;
    profilePhoto?: string;
  };
  history: HistoryEvent[];
  createdAt: string;
}

export default function PetHistoryModal({ petId, petName, open, onClose }: PetHistoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [pet, setPet] = useState<PetData | null>(null);

  useEffect(() => {
    if (open && petId) {
      loadHistory();
    }
  }, [open, petId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getPetHistory(petId);
      setPet(data);
    } catch (error: any) {
      console.error('Failed to load pet history:', error);
      toast.error('Failed to load pet history');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return '🎉';
      case 'updated':
        return '✏️';
      case 'listed':
        return '📢';
      case 'ownership_transferred':
        return '🔄';
      case 'deleted':
        return '🗑️';
      default:
        return '📝';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'created':
        return 'Created';
      case 'updated':
        return 'Updated';
      case 'listed':
        return 'Listed on Marketplace';
      case 'ownership_transferred':
        return 'Ownership Transferred';
      case 'deleted':
        return 'Deleted';
      default:
        return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return 'Unknown';
    const birth = new Date(birthDate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    
    if (years === 0) {
      return `${Math.max(1, months)} month${months !== 1 ? 's' : ''}`;
    }
    return `${years} year${years !== 1 ? 's' : ''}`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-3xl">
                🐾
              </div>
              <div>
                <h2 className="text-2xl font-bold">Pet Passport</h2>
                <p className="text-orange-100">{petName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="ml-3 text-gray-600">Loading history...</span>
            </div>
          ) : pet ? (
            <div className="p-6 space-y-6">
              {/* Pet Info Card */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-white shadow-md flex-shrink-0">
                    {pet.photoUrl ? (
                      <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🐾
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{pet.name}</h3>
                      <p className="text-gray-600">{pet.speciesCategoryName} · {pet.sex}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-orange-600" />
                        <span className="text-gray-700">Age: {calculateAge(pet.birthDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span className="text-gray-700">
                          Born: {pet.birthDate ? new Date(pet.birthDate).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current & Original Owner */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Original Owner</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-semibold">
                      {pet.userId.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{pet.userId.name}</p>
                      <p className="text-xs text-gray-600">{pet.userId.email}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-green-600" />
                    <h4 className="font-semibold text-green-900">Current Owner</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-semibold">
                      {pet.currentOwnerId.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{pet.currentOwnerId.name}</p>
                      <p className="text-xs text-gray-600">{pet.currentOwnerId.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
          <div>
  <div className="flex items-center gap-2 mb-4">
    <Package className="w-5 h-5 text-gray-700" />
    <h4 className="text-lg font-semibold text-gray-900">History Timeline</h4>
  </div>
  
  <div className="relative">
    {/* Timeline line */}
    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-300 to-gray-200"></div>
    
    <div className="space-y-4">
      {pet.history && pet.history.length > 0 ? (
        pet.history.map((event, index) => (
          <div key={index} className="relative pl-16 pb-6">
            {/* Timeline dot */}
            <div className="absolute left-3 top-1 w-6 h-6 rounded-full bg-white border-2 border-orange-500 flex items-center justify-center text-sm">
              {getActionIcon(event.action)}
            </div>
            
            {/* Event card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h5 className="font-semibold text-gray-900">
                    {getActionLabel(event.action)}
                  </h5>
                  <p className="text-sm text-gray-600">
                    {new Date(event.at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500 py-8">No history available</p>
      )}
    </div>
  </div>
</div>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <p>Failed to load pet information</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}