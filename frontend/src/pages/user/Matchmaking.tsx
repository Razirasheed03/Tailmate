import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/UiComponents/UserNavbar";
import { matchmakingService } from "@/services/matchmakingServices";
import CreateMatchmakingModal from "@/components/Modals/createMatchmodal";
import LocationInput from "@/components/common/LocationInput";
import { X } from "lucide-react";

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
  const [createOpen, setCreateOpen] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<SearchFilters>({
    q: searchParams.get("q") || "",
    place: searchParams.get("place") || "",
    sortBy: (searchParams.get("sortBy") as any) || "newest",
  });

  const [centerLocation, setCenterLocation] = useState<{
    lat: number | null;
    lng: number | null;
    place: string;
  }>({
    lat: null,
    lng: null,
    place: "",
  });

  // Default radius = 10 km (after location selected)
  const [radius, setRadius] = useState<number | null>(null);

  // -------------------------------------
  // Fetch Listings
  // -------------------------------------
  const fetchListings = useCallback(
    async (
      pageNumber = 1,
      searchFilters = filters,
      loc = centerLocation,
      r = radius
    ) => {
      try {
        setLoading(true);

        const params: any = {
          page: pageNumber,
          limit: 12,
          q: searchFilters.q.trim(),
          place: searchFilters.place.trim(),
          sortBy: searchFilters.sortBy,
        };

        if (loc.lat && loc.lng) {
          params.lat = loc.lat;
          params.lng = loc.lng;

          if (r && r > 0) params.radius = r;
        }

        const res = await matchmakingService.listPublic(params);

        setListings(res.data);
        setTotalPages(res.totalPages);
        setPage(res.page);

        const newParams = new URLSearchParams();
        if (searchFilters.q) newParams.set("q", searchFilters.q);
        if (searchFilters.place) newParams.set("place", searchFilters.place);
        setSearchParams(newParams);
      } catch (err) {
        console.error("Failed:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchListings(1, filters, centerLocation, radius);
  }, []);

  const handleSearch = (value: string) => {
    const updated = { ...filters, q: value };
    setFilters(updated);
    fetchListings(1, updated, centerLocation, radius);
  };

  const clearSearch = () => {
    const updated = { ...filters, q: "" };
    setFilters(updated);
    fetchListings(1, updated, centerLocation, radius);
  };

  // -------------------------------------
  // RENDER
  // -------------------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Matchmaking</h1>

        {/* FILTER BAR */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 space-y-4">

          {/* Search Row */}
          <div className="flex flex-wrap gap-4 items-center">

            {/* SEARCH */}
            <div className="flex-1 min-w-[220px] relative">
              <input
                type="text"
                placeholder="Search listings..."
                value={filters.q}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-3 py-2 pr-9 border rounded-lg"
              />
              {filters.q && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* LOCATION INPUT */}
            <div className="w-[260px]">
              <LocationInput
                value={centerLocation.place}
                onSelect={({ place, latitude, longitude }) => {
                  const loc = { lat: latitude, lng: longitude, place };
                  setCenterLocation(loc);

                  const updatedFilters = { ...filters, place };
                  setFilters(updatedFilters);

                  // Default radius 10 km after selecting location
                  setRadius(10);

                  fetchListings(1, updatedFilters, loc, 10);
                }}
                onClear={() => {
                  setCenterLocation({ lat: null, lng: null, place: "" });
                  setRadius(null);

                  const updatedFilters = { ...filters, place: "" };
                  setFilters(updatedFilters);

                  fetchListings(1, updatedFilters, { lat: null, lng: null, place: "" }, null);
                }}
              />
            </div>

            {/* SORT */}
            <select
              value={filters.sortBy}
              onChange={(e) => {
                const f = { ...filters, sortBy: e.target.value as any };
                setFilters(f);
                fetchListings(1, f, centerLocation, radius);
              }}
              className="px-3 py-2 border rounded-lg min-w-[140px]"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title_az">Title A–Z</option>
              <option value="title_za">Title Z–A</option>
            </select>
          </div>

          {/* RADIUS SLIDER */}
          {centerLocation.lat && centerLocation.lng && (
            <div className="pt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Search radius: {radius ?? 0} km</span>

                <span className="text-xs text-gray-500">
                  📍 Using <b>{centerLocation.place}</b>
                </span>
              </div>

              <input
                type="range"
                min={1}
                max={100}
                value={radius ?? 10}
                onChange={(e) => {
                  const r = Number(e.target.value);
                  setRadius(r);
                  fetchListings(1, filters, centerLocation, r);
                }}
                className="w-full accent-orange-500"
              />
            </div>
          )}
        </div>

        {/* LISTINGS */}
        {loading ? (
          <div className="text-center py-10">Loading…</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No listings found</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((item) => (
              <div
                key={item._id}
                onClick={() =>
                  navigate(`/matchmaking/${item._id}`, { state: { listing: item } })
                }
                className="bg-white rounded-lg shadow hover:shadow-md cursor-pointer"
              >
                <div className="aspect-square bg-gray-200 overflow-hidden rounded-t-lg">
                  {item.photos?.[0] ? (
                    <img
                      src={item.photos[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold truncate">{item.title}</h3>
                  <p className="text-xs text-gray-500 truncate">📍 {item.place}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-3 mt-8">
            <button
              disabled={page <= 1}
              onClick={() => fetchListings(page - 1, filters, centerLocation, radius)}
              className="px-4 py-2 border rounded disabled:opacity-40"
            >
              Prev
            </button>

            <span className="px-4 py-2 bg-orange-500 text-white rounded">
              {page}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => fetchListings(page + 1, filters, centerLocation, radius)}
              className="px-4 py-2 border rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}

           <button
        onClick={() => setCreateOpen(true)}
        aria-label="Create Listing"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-orange-600 text-white shadow-lg hover:bg-orange-700 active:scale-95 transition flex items-center justify-center z-50"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
          <path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" />
        </svg>
      </button>

        <CreateMatchmakingModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            fetchListings(1, filters, centerLocation, radius);
            setCreateOpen(false);
          }}
        />
      </main>
    </div>
  );
}
