// src/pages/user/profile/Listings.tsx
import { useEffect, useState, useCallback } from "react";
import { marketplaceService } from "@/services/marketplaceService";
import { ListingMapper } from "@/mappers/listingMapper";
import type {
  PaginatedResponse,
  ListingStatus,
} from "@/types/marketplace.types";
import type { DomainListing, UIListing } from "@/types/api.types";
import EditListingModal from "./EditListingModal";

interface ListingsState {
  domainListings: DomainListing[];
  uiListings: UIListing[];
  loading: boolean;
  error: string | null;
  editingListing: DomainListing | null;
  deletingId: string | null;
}

const Listings: React.FC = () => {
  const [state, setState] = useState<ListingsState>({
    domainListings: [],
    uiListings: [],
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

      ///used common response model
      const response: PaginatedResponse<DomainListing> =
        await marketplaceService.getUserListings();

      // Handle the pagination response structure
      if (response && typeof response === "object") {
        let domainListings: DomainListing[] = [];

        if (Array.isArray(response)) {
          // Direct array response (fallback)
          domainListings = response;
        } else if (response.data && Array.isArray(response.data)) {
          // Proper paginated response
          domainListings = response.data;
        } else {
          console.warn("Unexpected response structure:", response);
          domainListings = [];
        }

        // Convert domain models to UI models for display
        const uiListings = ListingMapper.domainArrayToUIArray(domainListings);

        updateState({
          domainListings,
          uiListings,
        });
      } else {
        console.warn("Invalid response:", response);
        updateState({
          domainListings: [],
          uiListings: [],
        });
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load listings";
      console.error("Fetch listings error:", err);
      updateState({
        error: errorMessage,
        domainListings: [],
        uiListings: [],
      });
    } finally {
      updateState({ loading: false });
    }
  }, [updateState]);

  // Initial fetch
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
        const updatedListing: DomainListing =
          await marketplaceService.updateListingStatus(id, newStatus);

        if (updatedListing) {
          await fetchListings(); // Refresh list
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update status";
        updateState({ error: errorMessage });
      }
    },
    [updateState, fetchListings]
  );

  const handleEditListing = useCallback(
    (domainListing: DomainListing): void => {
      updateState({ editingListing: domainListing });
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
          My Listings ({state.uiListings.length})
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
      {state.uiListings.length === 0 ? (
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
        /* Listings Grid - Using UI Models for Display */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.uiListings.map((uiListing: UIListing, index: number) => {
            // Find corresponding domain listing for actions
            const domainListing = state.domainListings[index];

            return (
              <div
                key={uiListing.id}
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="aspect-video bg-gray-200 relative">
                  {uiListing.primaryImage ? (
                    <img
                      src={uiListing.primaryImage}
                      alt={uiListing.title}
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

                  {/* Status Badge - Using UI Model */}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${uiListing.statusColor}`}
                    >
                      {uiListing.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Type Badge - Using UI Model */}
                  <div className="absolute top-2 left-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        uiListing.type === "sell"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {uiListing.typeLabel}
                    </span>
                  </div>
                </div>

                {/* Content - Using UI Model Formatted Data */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg truncate">
                      {uiListing.title}
                    </h3>
                    <span className="text-orange-600 font-bold">
                      {uiListing.displayPrice}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {domainListing.description}
                  </p>

                  <div className="text-xs text-gray-500 space-y-1 mb-4">
                    {uiListing.age !== "Not specified" && (
                      <div>Age: {uiListing.age}</div>
                    )}
                    <div>Location: {uiListing.location}</div>
                    <div>Posted: {uiListing.createdDate}</div>
                  </div>

                  {/* Actions - Using Domain Model for Business Logic */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditListing(domainListing)}
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                      disabled={state.loading}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleStatusToggle(
                          domainListing.id,
                          domainListing.status
                        )
                      }
                      className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
                        domainListing.status === "active"
                          ? "bg-gray-600 text-white hover:bg-gray-700"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                      disabled={state.loading}
                    >
                      {domainListing.status === "active"
                        ? "Deactivate"
                        : "Activate"}
                    </button>

                    <button
                      onClick={() => handleDelete(domainListing.id)}
                      disabled={
                        state.deletingId === domainListing.id || state.loading
                      }
                      className="bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {state.deletingId === domainListing.id ? "..." : "Delete"}
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
