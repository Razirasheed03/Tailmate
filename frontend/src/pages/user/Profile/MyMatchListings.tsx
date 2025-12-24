// src/pages/profile/MatchmakingListings.tsx
import { useEffect, useState, useCallback } from "react";
import { matchmakingService } from "@/services/matchmakingServices";

/* ------------------ Confirm Modal ------------------ */
function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-sm p-5 shadow-xl">
        <h3 className="text-lg font-semibold">{title}</h3>
        {message && <p className="text-sm text-gray-600 mt-2">{message}</p>}

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------ MAIN PAGE ------------------ */
export default function MatchmakingListings() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  /* ------------ FETCH USER MATCHMAKING LISTS ------------ */
  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await matchmakingService.listMine(1, 50);
      const data = res.data || [];

      setListings(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load your matchmaking listings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  /* ------------ DELETE LISTING ------------ */
  const confirmDelete = (id: string) => setConfirmId(id);

  const handleDelete = async () => {
    if (!confirmId) return;
    try {
      await matchmakingService.delete(confirmId);
      setConfirmId(null);
      fetchListings();
    } catch {
      setError("Failed to delete listing.");
    }
  };

  /* ------------ TOGGLE STATUS ------------ */
  const toggleStatus = async (item: any) => {
    try {
      const newStatus = item.status === "active" ? "closed" : "active";
      await matchmakingService.changeStatus(item._id, newStatus);
      fetchListings();
    } catch {
      setError("Failed to update status.");
    }
  };

  /* ------------ LOADING UI ------------ */
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin h-8 w-8 border-b-2 border-orange-600 rounded-full"></div>
        <span className="ml-2 text-gray-600">Loading your matchmaking listings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          My Matchmaking Listings ({listings.length})
        </h2>
        <button
          onClick={fetchListings}
          className="text-orange-600 text-sm hover:text-orange-700"
        >
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 p-3 text-red-600 border border-red-200 rounded">
          {error}
        </div>
      )}

      {/* Empty state */}
      {listings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 mb-3">
            <svg className="w-14 h-14 mx-auto" fill="currentColor">
              <circle cx="10" cy="10" r="8"></circle>
            </svg>
          </div>
          <p className="text-gray-500 text-lg">No matchmaking posts found</p>
          <p className="text-gray-400 text-sm mt-1">
            You haven't created any matchmaking posts yet.
          </p>
        </div>
      ) : (
        /* Listings Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => {
            const id = item._id;

            return (
              <div
                key={id}
                className="border rounded-lg bg-white shadow-sm hover:shadow-md transition"
              >
                {/* Image */}
                <div className="aspect-video bg-gray-100 relative">
                  {item.photos?.[0] ? (
                    <img
                      src={item.photos[0]}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-gray-400">
                      No Image
                    </div>
                  )}

                  {/* Status */}
                  <span
                    className={`absolute top-2 right-2 px-2 py-1 text-xs rounded-full font-medium ${
                      item.status === "active"
                        ? "bg-green-100 text-green-800"
                        : item.status === "matched"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {item.status.toUpperCase()}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg truncate">{item.title}</h3>

                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="text-xs text-gray-500 mt-3 space-y-1">
                    <p>Location: {item.place}</p>
                    <p>Posted: {new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => toggleStatus(item)}
                      className={`flex-1 py-2 rounded text-sm text-white ${
                        item.status === "active"
                          ? "bg-gray-600 hover:bg-gray-700"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {item.status === "active" ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      onClick={() => confirmDelete(id)}
                      className="flex-1 py-2 rounded text-sm bg-red-600 text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!confirmId}
        title="Delete Matchmaking Listing?"
        message="This action cannot be undone."
        onCancel={() => setConfirmId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
