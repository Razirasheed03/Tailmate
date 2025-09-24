// src/pages/doctor/SimpleAvailability.tsx
import { useEffect, useMemo, useState } from "react";
import DoctorSidebar from "@/components/UiComponents/DoctorSidebar";
import {Trash2 } from "lucide-react";
import {
  doctorAvailabilityService,
  type UIMode,
  type UISlot,
} from "@/services/doctorAvailabilityService";

type VerificationStatus = "pending" | "verified" | "rejected";

type NewSlotForm = {
  time: string;
  durationMins: number;
  fee: number;
  modes: UIMode[];
};

function toYMD(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}
function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// 🚀 New helper to block past times
function isPastTime(dateStr: string, timeStr: string) {
  const now = new Date();
  const slotDate = new Date(dateStr + "T" + timeStr);
  return slotDate < now;
}

export default function SimpleAvailability() {
  const [verificationStatus] = useState<VerificationStatus>("verified");
  const isVerified = verificationStatus === "verified";

  const today = useMemo(() => new Date(), []);
  const minDate = useMemo(() => toYMD(today), [today]);
  const maxDate = useMemo(() => toYMD(addDays(today, 3)), [today]);

  const [selectedDate, setSelectedDate] = useState<string>(minDate);
  const [slotsByDate, setSlotsByDate] = useState<Record<string, UISlot[]>>({});
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<NewSlotForm>({
    time: "",
    durationMins: 30,
    fee: 1200,
    modes: ["video"],
  });

  // ⛔ Past time error state
  const [pastTimeError, setPastTimeError] = useState<string>("");

  const slotsForDay = useMemo(() => {
    const list = slotsByDate[selectedDate] || [];
    return [...list].sort((a, b) => a.time.localeCompare(b.time));
  }, [slotsByDate, selectedDate]);

  const conflictReason = useMemo(() => {
    if (!form.time) return "";
    const start = timeToMinutes(form.time);
    const end = start + form.durationMins;
    const list = slotsByDate[selectedDate] || [];
    const conflict = list.some((s) => {
      const sStart = timeToMinutes(s.time);
      const sEnd = sStart + s.durationMins;
      return start < sEnd && end > sStart;
    });
    return conflict ? "Conflicts with an existing slot; pick a non-overlapping time." : "";
  }, [form.time, form.durationMins, slotsByDate, selectedDate]);

  // Load from server when date changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const initial = await doctorAvailabilityService.getDaySlots(selectedDate);
        if (mounted) {
          setSlotsByDate((prev) => ({ ...prev, [selectedDate]: initial }));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedDate]);

  function toggleMode(m: UIMode) {
    setForm((f) => {
      const has = f.modes.includes(m);
      return { ...f, modes: has ? f.modes.filter((x) => x !== m) : [...f.modes, m] };
    });
  }

  // Persist on add
  async function addSlot() {
    if (!form.time) return;

    // ⛔ Block past times for today
    if (isPastTime(selectedDate, form.time)) {
      setPastTimeError("Selected time is in the past. Please choose a valid time.");
      return;
    } else {
      setPastTimeError("");
    }

    if (conflictReason) return;

    setLoading(true);
    try {
      const created = await doctorAvailabilityService.createSlot({
        date: selectedDate,
        time: form.time,
        durationMins: Number(form.durationMins) || 20,
        fee: Number(form.fee) || 0,
        modes: form.modes.length ? form.modes : ["video"],
        status: "available",
      });
      setSlotsByDate((prev) => {
        const list = prev[selectedDate] || [];
        return { ...prev, [selectedDate]: [...list, created] };
      });
      setForm((f) => ({ ...f, time: "" }));
    } finally {
      setLoading(false);
    }
  }

  // Persist on delete
  async function removeSlot(id: string) {
    setLoading(true);
    try {
      const ok = await doctorAvailabilityService.deleteSlot(id);
      if (ok) {
        setSlotsByDate((prev) => {
          const list = prev[selectedDate] || [];
          return { ...prev, [selectedDate]: list.filter((s) => s.id !== id) };
        });
      }
    } finally {
      setLoading(false);
    }
  }

  // Persist on toggle
  async function toggleStatus(id: string) {
    const curr = (slotsByDate[selectedDate] || []).find((s) => s.id === id);
    if (!curr) return;
    const next = curr.status === "available" ? "booked" : "available";
    setLoading(true);
    try {
      const updated = await doctorAvailabilityService.updateSlotStatus(id, next);
      setSlotsByDate((prev) => {
        const list = prev[selectedDate] || [];
        return {
          ...prev,
          [selectedDate]: list.map((s) => (s.id === id ? updated : s)),
        };
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex">
      <DoctorSidebar isVerified={isVerified} />
      <main className="flex-1 p-6 space-y-6 bg-gray-50">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Availability</h1>
            <p className="text-sm text-gray-500">
              Pick a date (next 4 days only), add non-overlapping slots, and toggle Available/Booked.
            </p>
          </div>
         
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border rounded p-4">
            <div className="text-sm font-medium mb-2">Select Date</div>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={selectedDate}
              min={minDate}
              max={maxDate}
              onChange={(e) => {
                const next = e.target.value;
                if (next < minDate) setSelectedDate(minDate);
                else if (next > maxDate) setSelectedDate(maxDate);
                else setSelectedDate(next);
              }}
            />
            <div className="text-xs text-gray-500 mt-1">
              Allowed: {minDate} → {maxDate}
            </div>
          </div>

          {/* Slots display */}
          <div className="md:col-span-2 bg-white border rounded p-4">
            <div className="text-sm font-medium mb-3">
              Time Slots for {new Date(selectedDate).toDateString()}
            </div>
            {loading && <div className="text-xs text-gray-500">Syncing…</div>}
            {slotsForDay.length === 0 ? (
              <div className="text-sm text-gray-500">No slots yet for this date.</div>
            ) : (
              <div className="space-y-2">
                {slotsForDay.map((s) => {
                  const [h, m] = s.time.split(":").map(Number);
                  const period = h >= 12 ? "PM" : "AM";
                  const hour12 = h % 12 === 0 ? 12 : h % 12;
                  const minutes = m.toString().padStart(2, "0");
                  const displayTime = `${hour12}:${minutes} ${period}`;

                  return (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between border rounded px-3 py-2 ${
                        s.status === "available"
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-medium">{displayTime}</span>
                        <span className="text-gray-500">• {s.durationMins}m</span>
                        <span className="text-gray-500">• ₹{s.fee}</span>
                        <span className="text-gray-500">• {s.modes.join(", ")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs ${
                            s.status === "available" ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          {s.status === "available" ? "Available" : "Booked"}
                        </span>
                        <button
                          onClick={() => toggleStatus(s.id)}
                          className="text-xs px-2 py-1 rounded border hover:bg-gray-100"
                        >
                          Toggle
                        </button>
                        <button
                          onClick={() => removeSlot(s.id)}
                          className="text-xs px-2 py-1 rounded border hover:bg-gray-100"
                          title="Delete slot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Add slot form */}
        <section className="bg-white border rounded p-4">
          <div className="text-sm font-medium mb-3">Add New Time Slot</div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Time</label>
              <input
                type="time"
                className="w-full border rounded px-3 py-2"
                value={form.time}
                onChange={(e) => {
                  setForm((f) => ({ ...f, time: e.target.value }));
                  setPastTimeError(""); // reset error on change
                }}
              />
              {pastTimeError && (
                <div className="text-xs text-red-600 mt-1">{pastTimeError}</div>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Duration (mins)</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.durationMins}
                onChange={(e) =>
                  setForm((f) => ({ ...f, durationMins: Number(e.target.value) }))
                }
              >
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={45}>45</option>
                <option value={60}>60</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Session Fee</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={form.fee}
                onChange={(e) => setForm((f) => ({ ...f, fee: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={addSlot}
                className="w-full px-3 py-2 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                disabled={!form.time || !!conflictReason || !!pastTimeError || loading}
              >
                Add Slot
              </button>
            </div>
          </div>

          {!!conflictReason && (
            <div className="text-xs text-red-600 mt-2">{conflictReason}</div>
          )}

          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-1">Session Modes</div>
            <div className="flex gap-2">
              {(["video", "audio", "inPerson"] as UIMode[]).map((m) => {
                const active = form.modes.includes(m);
                return (
                  <button
                    type="button"
                    key={m}
                    onClick={() => toggleMode(m)}
                    className={`px-3 py-1 rounded border text-sm ${
                      active
                        ? "bg-sky-50 border-sky-300 text-sky-700"
                        : "bg-white border-gray-300 text-gray-700"
                    }`}
                  >
                    {m === "inPerson" ? "In-Person" : m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
