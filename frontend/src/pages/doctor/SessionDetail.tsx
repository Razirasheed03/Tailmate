// src/pages/doctor/SessionDetail.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DoctorSidebar from "@/components/UiComponents/DoctorSidebar";
import { doctorService, type SessionDetail } from "@/services/doctorService";

function label(dt: { date: string; time: string }) {
  const [h, m] = dt.time.split(":").map(Number);
  const d = new Date(dt.date + "T00:00:00Z");
  d.setHours(h, m, 0, 0);
  return d.toLocaleString(undefined, { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [row, setRow] = useState<SessionDetail | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) { nav("/doctor/sessions", { replace: true }); return; }
      setLoading(true);
      try {
        const data = await doctorService.getSession(id);
        if (!mounted) return;
        setRow(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, nav]);

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="flex h-screen">
        <DoctorSidebar isVerified={true} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <button onClick={() => nav(-1)} className="text-sm text-sky-700 hover:underline mb-3">
              ← Back to sessions
            </button>

            <section className="bg-white border rounded-xl p-5">
              <h1 className="text-lg font-semibold mb-2">Session Details</h1>
              {loading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : !row ? (
                <div className="text-sm text-gray-500">Not found.</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 text-xs">When</div>
                      <div className="font-medium">{label({ date: row.date, time: row.time })}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Status</div>
                      <div className="font-medium">{row.status}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Mode</div>
                      <div className="font-medium">{row.mode === "inPerson" ? "In‑Person" : row.mode}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Duration</div>
                      <div className="font-medium">{row.durationMins} mins</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Patient</div>
                      <div className="font-medium">{row.patientName || row.patientId}</div>
                      <div className="text-xs text-gray-500">{row.patientEmail || ""}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Pet</div>
                      <div className="font-medium">{row.petName}</div>
                    </div>
                  </div>

                  {row.notes ? (
                    <div className="mt-4">
                      <div className="text-gray-500 text-xs mb-1">Notes</div>
                      <div className="text-sm">{row.notes}</div>
                    </div>
                  ) : null}

                  <div className="mt-6 flex gap-2">
                    <button className="px-3 py-2 rounded border">Copy meeting link</button>
                    <button className="px-3 py-2 rounded border">Message patient</button>
                    <button className="px-3 py-2 rounded bg-black text-white">Open session</button>
                  </div>
                </>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
