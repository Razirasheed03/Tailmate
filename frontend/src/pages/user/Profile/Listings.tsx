// src/pages/user/profile/Listings.tsx
import { useEffect, useState, useCallback } from "react";
import { marketplaceService } from "@/services/marketplaceService";
import type { ListingStatus } from "@/types/marketplace.types";
import EditListingModal from "./EditListingModal";

/* Simple confirm dialog component (inline) */
function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-sm p-5">
        <h3 className="text-lg font-semibold">{title}</h3>
        {message && <p className="text-sm text-gray-600 mt-1">{message}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="px-3 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-2 text-sm rounded bg-rose-600 text-white hover:bg-rose-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ListingsState {
  listings: any[];
  loading: boolean;
  error: string | null;
  editingListing: any | null;
  deletingId: string | null;
}

const Listings: React.FC = () => {
  const [state, setState] = useState<ListingsState>({
    listings: [],
    loading: true,
    error: null,
    editingListing: null,
    deletingId: null,
  });
  // confirm modal state
  const [confirmFor, setConfirmFor] = useState<string | null>(null);
const [toggledIds, setToggledIds] = useState<Set<string>>(() => {
  try {
    const raw = localStorage.getItem("listing-toggle");
    const arr: string[] = raw ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch { return new Set(); }
});
useEffect(() => {
  try {
    localStorage.setItem("listing-toggle", JSON.stringify([...toggledIds]));
  } catch {}
}, [toggledIds]);


  const updateState = useCallback((updates: Partial<ListingsState>): void => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const fetchListings = useCallback(async (): Promise<void> => {
    try {
      updateState({ loading: true, error: null });

      const response = await marketplaceService.getUserListings();

      if (response && typeof response === "object") {
        let apiListings: any[] = [];
        if (Array.isArray(response)) {
          apiListings = response;
        } else if (response.data && Array.isArray(response.data)) {
          apiListings = response.data;
        } else {
          console.warn("Unexpected response structure:", response);
          apiListings = [];
        }
        updateState({ listings: apiListings });
      } else {
        console.warn("Invalid response:", response);
        updateState({ listings: [] });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load listings";
      console.error("Fetch listings error:", err);
      updateState({ error: errorMessage, listings: [] });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  // show confirm modal instead of window.confirm
  const askDelete = useCallback((id: string) => {
    setConfirmFor(id);
  }, []);

  const handleDeleteConfirmed = useCallback(async () => {
    if (!confirmFor) return;
    const id = confirmFor;
    setConfirmFor(null);
    try {
      updateState({ deletingId: id, error: null });
      const success: boolean = await marketplaceService.deleteListing(id);
      if (success) {
        await fetchListings();
      } else {
        throw new Error("Delete operation failed");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete listing";
      updateState({ error: errorMessage });
    } finally {
      updateState({ deletingId: null });
    }
  }, [confirmFor, updateState, fetchListings]);

  const handleStatusToggle = useCallback(
    async (id: string, currentStatus: string): Promise<void> => {
      try {
        updateState({ error: null });
        const newStatus: ListingStatus = currentStatus === "active" ? "inactive" : "active";
        await marketplaceService.updateListingStatus(id, newStatus);
        await fetchListings();
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update status";
        updateState({ error: errorMessage });
      }
    },
    [updateState, fetchListings]
  );

  const handleEditListing = useCallback((listing: any): void => {
    updateState({ editingListing: listing });
  }, [updateState]);

  const handleCloseEditModal = useCallback((): void => {
    updateState({ editingListing: null });
  }, [updateState]);

  const handleListingUpdated = useCallback(async (): Promise<void> => {
    updateState({ editingListing: null });
    await fetchListings();
  }, [updateState, fetchListings]);

  if (state.loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-2 text-gray-600">Loading your listings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">My Listings ({state.listings.length})</h2>
        <button
          onClick={fetchListings}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          disabled={state.loading}
        >
          Refresh
        </button>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          <div className="flex justify-between items-center">
            <span>{state.error}</span>
            <button onClick={() => updateState({ error: null })} className="text-red-400 hover:text-red-600">×</button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {state.listings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-gray-500 text-lg">No listings found</div>
          <p className="text-gray-400 mt-2">You haven't posted any pet listings yet.</p>
        </div>
      ) : (
        /* Listings Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.listings.map((listing) => {
            const listingId = listing._id || listing.id;

            return (
              <div key={listingId} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="aspect-video bg-gray-200 relative">
                  {listing.photos?.[0] ? (
                    <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                      </svg>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        listing.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : listing.status === 'inactive'
                          ? 'bg-gray-100 text-gray-800'
                          : listing.status === 'sold'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {String(listing.status).toUpperCase()}
                    </span>
                  </div>

                  {/* Type Badge */}
                  <div className="absolute top-2 left-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        listing.type === "sell" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"
                      }`}
                    >
                      {listing.type === "sell" ? "For Sale" : "For Adoption"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg truncate">{listing.title}</h3>
                    <span className="text-orange-600 font-bold">
                      {listing.type === 'adopt' || !listing.price ? 'Free' : `₹${Number(listing.price).toLocaleString('en-IN')}`}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{listing.description}</p>

                  <div className="text-xs text-gray-500 space-y-1 mb-4">
                    {(listing.age_text || listing.ageText) && <div>Age: {listing.age_text || listing.ageText} years</div>}
                    <div>Location: {listing.place || listing.location}</div>
                    <div>Posted: {new Date(listing.created_at || listing.createdAt).toLocaleDateString()}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditListing(listing)}
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                      disabled={state.loading}
                    >
                      Edit
                    </button>


{(() => {
  const isToggled = toggledIds.has(listingId);
  return (
    <button
      onClick={async () => {
        try {
          await handleStatusToggle(listingId, listing.status);
          setToggledIds((prev) => {
            const next = new Set(prev);
            if (prev.has(listingId)) next.delete(listingId);
            else next.add(listingId);
            return next;
          });
        } catch {
        }
      }}
      className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
        isToggled
          ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
          : "bg-rose-600 text-white hover:bg-rose-700"
      }`}
      disabled={state.loading}
    >
      {isToggled ? "Repost" : "Sold"}
    </button>
  );
})()}




                    <button
                      onClick={() => askDelete(listingId)}
                      disabled={state.deletingId === listingId || state.loading}
                      className="bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {state.deletingId === listingId ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {state.editingListing && (
        <EditListingModal
          open={!!state.editingListing}
          listing={state.editingListing}
          onClose={handleCloseEditModal}
          onUpdated={handleListingUpdated}
        />
      )}

      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!confirmFor}
        title="Delete this listing?"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmFor(null)}
      />
    </div>
  );
};

export default Listings;
