// src/pages/doctor/Sessions.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DoctorSidebar from "@/components/UiComponents/DoctorSidebar";
import { doctorService } from "@/services/doctorService";
import type { SessionRow } from "@/types/doctor.types";
type TabKey = "upcoming" | "today" | "past";

function formatDateTime(date: string, time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date + "T00:00:00Z");
  d.setHours(h, m, 0, 0);
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function DoctorSessions() {
  const [tab, setTab] = useState<TabKey>("upcoming");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"all" | "video" | "audio" | "inPerson">("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SessionRow[]>([]);
  const [total, setTotal] = useState(0);

  const canLoadMore = useMemo(() => items.length < total, [items.length, total]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data, total } = await doctorService.listSessions({
          page,
          limit,
          scope: tab,
          q: query || undefined,
          mode: mode === "all" ? undefined : mode,
        });
        if (!mounted) return;
        setItems((prev) => (page === 1 ? data : [...prev, ...data]));
        setTotal(total);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [tab, query, mode, page, limit]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="flex h-screen">
        <DoctorSidebar isVerified={true} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <header className="flex items-center gap-3 mb-4">
              <h1 className="text-xl font-semibold">My Sessions</h1>
              <nav className="flex gap-2 ml-6">
                {(["upcoming", "today", "past"] as TabKey[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setPage(1); }}
                    className={`px-3 py-1.5 rounded text-sm border ${tab === t ? "bg-black text-white border-black" : "bg-white border-gray-300"}`}
                  >
                    {t[0].toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </nav>
              <form onSubmit={onSearch} className="ml-auto flex gap-2">
                <input
                  placeholder="Search by patient or pet"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="border rounded px-3 py-2 w-64"
                />
                <select
                  value={mode}
                  onChange={(e) => { setMode(e.target.value as any); setPage(1); }}
                  className="border rounded px-3 py-2"
                >
                  <option value="all">All modes</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="inPerson">In‑Person</option>
                </select>
                <button className="px-3 py-2 rounded bg-black text-white">Filter</button>
              </form>
            </header>

            {items.length === 0 && !loading ? (
              <div className="text-sm text-gray-600">No sessions.</div>
            ) : (
              <div className="bg-white border rounded-xl">
                <div className="grid grid-cols-12 px-4 py-2 text-xs text-gray-500 border-b">
                  <div className="col-span-4">When</div>
                  <div className="col-span-3">Patient</div>
                  <div className="col-span-2">Pet</div>
                  <div className="col-span-1">Mode</div>
                  <div className="col-span-1">Dur</div>
                  <div className="col-span-1 text-right">Status</div>
                </div>
                <ul className="divide-y">
                  {items.map((s) => (
                    <li key={s._id} className="grid grid-cols-12 px-4 py-3 items-center">
                      <div className="col-span-4">
                        <div className="text-sm font-medium">{formatDateTime(s.date, s.time)}</div>
                        <div className="text-xs text-gray-500">#{s._id}</div>
                      </div>
                      <div className="col-span-3">
                        <div className="text-sm">{s.patientName || "Patient"}</div>
                        <div className="text-xs text-gray-500">{s.patientEmail || ""}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-sm">{s.petName}</div>
                        {s.notes ? <div className="text-xs text-gray-500 truncate">{s.notes}</div> : null}
                      </div>
                      <div className="col-span-1 text-sm">{s.mode === "inPerson" ? "In‑Person" : s.mode}</div>
                      <div className="col-span-1 text-sm">{s.durationMins}m</div>
                      <div className="col-span-1 text-right">
                        <span className={`text-xs px-2 py-1 rounded ${
                          s.status === "paid" ? "bg-emerald-50 text-emerald-700" :
                          s.status === "pending" ? "bg-amber-50 text-amber-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {s.status}
                        </span>
                      </div>
                      <div className="col-span-12 pt-2">
                        <Link to={`/doctor/sessions/${s._id}`} className="text-xs text-sky-700 hover:underline">
                          View details
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
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
          </div>
        </main>
      </div>
    </div>
  );
}
