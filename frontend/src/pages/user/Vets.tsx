// src/pages/user/Vets.tsx
import React, { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/UiComponents/UserNavbar";
import { vetsService, type DoctorCard } from "@/services/vetsService";
import { Link } from "react-router-dom";

export default function Vets() {
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<DoctorCard[]>([]);
  const [total, setTotal] = useState(0);

  const canLoadMore = useMemo(
    () => items.length < total,
    [items.length, total]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data, total } = await vetsService.listDoctors({
          page,
          limit,
          search: query || undefined,
          specialty: specialty || undefined,
        });
        if (!mounted) return;
        setItems((prev) => (page === 1 ? data : [...prev, ...data]));
        setTotal(total);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [page, limit, query, specialty]);

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <header className="flex items-center gap-3 mb-4">
          <h1 className="text-xl font-semibold">All Therapists</h1>
          <form onSubmit={onSearchSubmit} className="ml-auto flex gap-2">
            <input
              placeholder="Search name or keyword"
              className="border rounded px-3 py-2 w-64"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="border rounded px-3 py-2"
              value={specialty}
              onChange={(e) => {
                setSpecialty(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All specialties</option>
              <option value="Dogs">Dogs</option>
              <option value="Cats">Cats</option>
              <option value="Exotic Pets">Exotic Pets</option>
              <option value="Emergency Care">Emergency Care</option>
              {/* add more as needed */}
            </select>
            <button
              type="submit"
              className="px-3 py-2 rounded bg-black text-white"
            >
              Filter
            </button>
          </form>
        </header>

        {/* Grid */}
        {items.length === 0 && !loading ? (
          <div className="text-sm text-gray-600">No doctors found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((d) => (
              <article
                key={d.doctorId}
                className="bg-white border rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={d.avatarUrl || "https://via.placeholder.com/48"}
                    alt={d.displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold">
                      {d.displayName || "Dr. (Name)"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {d.experienceYears ?? 0} years experience
                    </div>
                  </div>
                  {/* <span
                    className={`ml-auto text-xs px-2 py-1 rounded ${
                      d.isOnline
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {d.isOnline ? "Online" : "Offline"}
                  </span> */}
                </div>

                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-1">
                    Specializes in:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(d.specialties || []).slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="text-xs px-2 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-1">
                    Next available:
                  </div>
                  {d.nextSlot ? (
                    <div className="text-sm">
                      {d.nextSlot.date} • {d.nextSlot.time}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      No upcoming slots
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    Modes: {(d.modes || []).join(", ") || "—"}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm">
                    ₹{d.consultationFee ?? 0}
                    <span className="text-gray-500"> per session</span>
                  </div>
                  <div className="flex gap-2">
                <div className="flex gap-2">
<Link to={`/vets/${d.doctorId}`} className="px-3 py-1.5 text-sm border rounded">Profile</Link>
<Link to={`/vets/${d.doctorId}`} className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded">Book</Link>
</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="flex justify-center mt-6">
          <button
            disabled={!canLoadMore || loading}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            {loading ? "Loading..." : canLoadMore ? "Load More" : "No more"}
          </button>
        </div>
      </main>
    </div>
  );
}
