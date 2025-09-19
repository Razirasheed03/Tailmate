// src/pages/user/profile/Listings.tsx
import { useEffect, useState, useCallback } from "react";
import { marketplaceService } from "@/services/marketplaceService";
import type { ListingStatus } from "@/types/marketplace.types";
import EditListingModal from "./EditListingModal";

interface ListingsState {
  listings: any[]; // Simplified to single array
  loading: boolean;
  error: string | null;
  editingListing: any | null; // Use any instead of DomainListing
  deletingId: string | null;
}

const Listings: React.FC = () => {
  const [state, setState] = useState<ListingsState>({
    listings: [], // Single array instead of separate domain/ui
    loading: true,
    error: null,
    editingListing: null,
    deletingId: null,
  });

  // Helper function to update state
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

        // Use raw data directly - no mapping or validation needed
        updateState({
          listings: apiListings,
        });
      } else {
        console.warn("Invalid response:", response);
        updateState({
          listings: [],
        });
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load listings";
      console.error("Fetch listings error:", err);
      updateState({
        error: errorMessage,
        listings: [],
      });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleDelete = useCallback(
    async (id: string): Promise<void> => {
      if (!window.confirm("Are you sure you want to delete this listing?"))
        return;

      try {
        updateState({ deletingId: id, error: null });

        const success: boolean = await marketplaceService.deleteListing(id);

        if (success) {
          await fetchListings(); // Refresh list
        } else {
          throw new Error("Delete operation failed");
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete listing";
        updateState({ error: errorMessage });
      } finally {
        updateState({ deletingId: null });
      }
    },
    [updateState, fetchListings]
  );

  const handleStatusToggle = useCallback(
    async (id: string, currentStatus: string): Promise<void> => {
      try {
        updateState({ error: null });

        const newStatus: ListingStatus =
          currentStatus === "active" ? "inactive" : "active";
        await marketplaceService.updateListingStatus(id, newStatus);

        // Refresh listings after update
        await fetchListings();
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update status";
        updateState({ error: errorMessage });
      }
    },
    [updateState, fetchListings]
  );

  const handleEditListing = useCallback(
    (listing: any): void => {
      updateState({ editingListing: listing });
    },
    [updateState]
  );

  const handleCloseEditModal = useCallback((): void => {
    updateState({ editingListing: null });
  }, [updateState]);

  const handleListingUpdated = useCallback(async (): Promise<void> => {
    updateState({ editingListing: null });
    await fetchListings();
  }, [updateState, fetchListings]);

  // Loading state
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
        <h2 className="text-xl font-semibold">
          My Listings ({state.listings.length})
        </h2>
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
            <button
              onClick={() => updateState({ error: null })}
              className="text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {state.listings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-gray-500 text-lg">No listings found</div>
          <p className="text-gray-400 mt-2">
            You haven't posted any pet listings yet.
          </p>
        </div>
      ) : (
        /* Listings Grid - Using Raw Data with Inline Formatting */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.listings.map((listing) => {
            // Get listing ID (handle both _id and id)
            const listingId = listing._id || listing.id;

            return (
              <div
                key={listingId}
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="aspect-video bg-gray-200 relative">
                  {listing.photos?.[0] ? (
                    <img
                      src={listing.photos[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg
                        className="w-8 h-8"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                      </svg>
                    </div>
                  )}

                  {/* Status Badge - Inline Logic */}
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
                      {listing.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Type Badge - Inline Logic */}
                  <div className="absolute top-2 left-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        listing.type === "sell"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {listing.type === "sell" ? "For Sale" : "For Adoption"}
                    </span>
                  </div>
                </div>

                {/* Content - Raw Data with Inline Formatting */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg truncate">
                      {listing.title}
                    </h3>
                    <span className="text-orange-600 font-bold">
                      {/* Inline Price Formatting */}
                      {listing.type === 'adopt' || !listing.price 
                        ? 'Free' 
                        : `₹${listing.price.toLocaleString('en-IN')}`
                      }
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {listing.description}
                  </p>

                  <div className="text-xs text-gray-500 space-y-1 mb-4">
                    {/* Inline Age Formatting */}
                    {(listing.age_text || listing.ageText) && (
                      <div>Age: {listing.age_text || listing.ageText} years</div>
                    )}
                    <div>Location: {listing.place || listing.location}</div>
                    <div>
                      Posted: {new Date(listing.created_at || listing.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions - Using Raw Data */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditListing(listing)}
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                      disabled={state.loading}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleStatusToggle(listingId, listing.status)
                      }
                      className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
                        listing.status === "active"
                          ? "bg-gray-600 text-white hover:bg-gray-700"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                      disabled={state.loading}
                    >
                      {listing.status === "active"
                        ? "Deactivate"
                        : "Activate"}
                    </button>

                    <button
                      onClick={() => handleDelete(listingId)}
                      disabled={
                        state.deletingId === listingId || state.loading
                      }
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
    </div>
  );
};

export default Listings;
