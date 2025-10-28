import { useEffect, useState, useCallback } from "react";
import { getPetHistory } from "@/services/petsApiService";
import { Button } from "@/components/UiComponents/button";
import { X, Calendar, User, Clock, Package } from "lucide-react";
import { toast } from "sonner";

interface PetHistoryModalProps {
  petId: string;
  petName: string;
  open: boolean;
  onClose: () => void;
}

interface HistoryEvent {
  at: string;
  action: string;
  by: { _id: string; name: string; email?: string; profilePhoto?: string };
  meta?: any;
}

interface PetData {
  _id: string;
  name: string;
  speciesCategoryName: string;
  sex: string;
  birthDate?: string;
  photoUrl?: string;
  userId: { _id: string; name: string; email?: string; profilePhoto?: string };
  currentOwnerId: { _id: string; name: string; email?: string; profilePhoto?: string };
  history: HistoryEvent[];
  createdAt: string;
}

export default function PetHistoryModal({ petId, petName, open, onClose }: PetHistoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [pet, setPet] = useState<PetData | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPetHistory(petId);
      setPet(data);
    } catch (error: any) {
      console.error("Failed to load pet history:", error);
      toast.error("Failed to load pet history");
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    if (open && petId) loadHistory();
  }, [open, petId, loadHistory]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created": return "🎉";
      case "updated": return "✏️";
      case "listed": return "📢";
      case "ownership_transferred": return "🔄";
      case "deleted": return "🗑️";
      default: return "📝";
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "created": return "Created";
      case "updated": return "Updated";
      case "listed": return "Listed on Marketplace";
      case "ownership_transferred": return "Ownership Transferred";
      case "deleted": return "Deleted";
      default:
        return action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return "Unknown";
    const birth = new Date(birthDate);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    if (months < 0) { years -= 1; months += 12; }
    if (years <= 0) return `${Math.max(1, months)} month${months !== 1 ? "s" : ""}`;
    return `${years} year${years !== 1 ? "s" : ""}`;
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Sticky header (always visible) */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-bold truncate">Pet Passport</h2>
              <p className="text-xs text-orange-100 truncate">{petName}</p>
            </div>
            <button
              aria-label="Close"
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="max-h-[70vh] overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600" />
              <span className="ml-2 text-sm">Loading history...</span>
            </div>
          ) : pet ? (
            <div className="space-y-4">
              {/* Pet summary */}
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-white shadow">
                    {pet.photoUrl ? (
                      <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🐾</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 truncate">{pet.name}</h3>
                    <p className="text-xs text-gray-600 truncate">
                      {pet.speciesCategoryName} · {pet.sex}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-orange-600" />
                        <span>Age: {calculateAge(pet.birthDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span>
                          Born: {pet.birthDate ? new Date(pet.birthDate).toLocaleDateString() : "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Owners */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-semibold text-blue-900">Original Owner</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 text-sm font-semibold">
                      {pet.userId.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{pet.userId.name}</p>
                      <p className="text-xs text-gray-600 truncate">{pet.userId.email}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <User className="w-4 h-4 text-green-600" />
                    <h4 className="text-sm font-semibold text-green-900">Current Owner</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-green-200 flex items-center justify-center text-green-700 text-sm font-semibold">
                      {pet.currentOwnerId.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{pet.currentOwnerId.name}</p>
                      <p className="text-xs text-gray-600 truncate">{pet.currentOwnerId.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-gray-700" />
                  <h4 className="text-sm font-semibold text-gray-900">History</h4>
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-300 to-gray-200" />
                  <div className="space-y-3">
                    {Array.isArray(pet.history) && pet.history.length > 0 ? (
                      pet.history.map((event, idx) => (
                        <div key={idx} className="relative pl-10">
                          <div className="absolute left-1 top-1 w-6 h-6 rounded-full bg-white border-2 border-orange-500 flex items-center justify-center text-sm">
                            {getActionIcon(event.action)}
                          </div>
                          <div className="bg-white border border-gray-200 rounded-md p-3 shadow-sm">
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="text-sm font-semibold text-gray-900">{getActionLabel(event.action)}</h5>
                                <p className="text-xs text-gray-600">
                                  {new Date(event.at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 text-sm py-6">No history available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-gray-500 text-sm">Failed to load pet information</div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 py-3">
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline" size="sm">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
