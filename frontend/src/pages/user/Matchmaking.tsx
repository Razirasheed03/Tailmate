import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/UiComponents/UserNavbar";
import { matchmakingService } from "@/services/matchMakingServices";
import CreateMatchmakingModal from "@/components/Modals/createMatchmodal";


interface SearchFilters {
  q: string;
  place: string;
  sortBy: "newest" | "oldest" | "title_az" | "title_za";
}

export default function Matchmaking() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);


  const [open, setOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<SearchFilters>({
    q: searchParams.get("q") || "",
    place: searchParams.get("place") || "",
    sortBy: (searchParams.get("sortBy") as any) || "newest",
  });

  const fetchListings = useCallback(
    async (pageNumber = 1, searchFilters = filters) => {
      try {
        setLoading(true);

        const params: any = {
          page: pageNumber,
          limit: 12,
          q: searchFilters.q.trim(),
          place: searchFilters.place.trim(),
          sortBy: searchFilters.sortBy,
        };

        const res = await matchmakingService.listPublic(params);

        setListings(res.data);
        setTotalPages(res.totalPages);
        setTotal(res.total);
        setPage(res.page);

        const newParams = new URLSearchParams();
        if (searchFilters.q) newParams.set("q", searchFilters.q);
        if (searchFilters.place) newParams.set("place", searchFilters.place);
        if (searchFilters.sortBy !== "newest")
          newParams.set("sortBy", searchFilters.sortBy);
        setSearchParams(newParams);
      } catch (err) {
        console.error("Failed to load matchmaking listings:", err);
      } finally {
        setLoading(false);
      }
    },
    [filters, setSearchParams]
  );

  useEffect(() => {
    fetchListings(1, filters);
  }, []);

  const handleSearch = (v: string) => {
    const newFilters = { ...filters, q: v };
    setFilters(newFilters);
    fetchListings(1, newFilters);
  };

  const handleCardClick = (listing: any) => {
    navigate(`/matchmaking/${listing._id}`, { state: { listing } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Matchmaking</h1>

        {/* Search + Sort Bar */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex gap-3 items-center">
            <input
              type="text"
              placeholder="Search listings..."
              value={filters.q}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg"
            />

            <input
              type="text"
              placeholder="Place..."
              value={filters.place}
              onChange={(e) => {
                const f = { ...filters, place: e.target.value };
                setFilters(f);
                fetchListings(1, f);
              }}
              className="px-3 py-2 border rounded-lg"
            />

            <select
              value={filters.sortBy}
              onChange={(e) => {
                const f = { ...filters, sortBy: e.target.value as any };
                setFilters(f);
                fetchListings(1, f);
              }}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title_az">Title A–Z</option>
              <option value="title_za">Title Z–A</option>
            </select>
          </div>
        </div>

        {/* Listings */}
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No matchmaking listings found
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((item) => (
              <div
                key={item._id}
                onClick={() => handleCardClick(item)}
                className="bg-white rounded-lg shadow cursor-pointer hover:shadow-md"
              >
                <div className="aspect-square bg-gray-200 overflow-hidden">
                  {item.photos?.[0] ? (
                    <img
                      src={item.photos[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No Image
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                  <p className="text-xs text-gray-500 truncate">
                    📍 {item.place}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-3 mt-8">
            <button
              disabled={page <= 1}
              onClick={() => fetchListings(page - 1)}
              className="px-4 py-2 border rounded disabled:opacity-40"
            >
              Prev
            </button>

            <span className="px-4 py-2 bg-orange-500 text-white rounded">
              {page}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => fetchListings(page + 1)}
              className="px-4 py-2 border rounded disabled:opacity-40"
            >
              Next
            </button>
          
          </div>
        )}
          {/* Floating create button */}
<button
  onClick={() => setCreateOpen(true)}
  aria-label="Create Matchmaking Listing"
  className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-orange-600 text-white shadow-lg hover:bg-orange-700 active:scale-95 transition flex items-center justify-center z-50"
>
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
    <path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" />
  </svg>
</button>

{/* Create Modal */}
<CreateMatchmakingModal
  open={createOpen}
  onClose={() => setCreateOpen(false)}
  onCreated={() => {
    fetchListings(1, filters);
    setCreateOpen(false);
  }}
/>

      </main>
    </div>
  );
}
