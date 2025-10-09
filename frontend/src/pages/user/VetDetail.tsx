// src/pages/user/VetDetail.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/UiComponents/UserNavbar";
import { vetsService, type UIMode } from "@/services/vetsService";

type DoctorDetail = {
  doctorId: string;
  displayName: string;
  avatarUrl?: string;
  experienceYears?: number;
  specialties?: string[];
  consultationFee?: number;
  bio?: string;
  languages?: string[];
  location?: string;
  modes?: UIMode[];
};

type Slot = {
  id: string;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:mm
  durationMins: number;  // e.g., 15, 30, 60
  fee: number;           // integer
  modes: UIMode[];
  status: "available" | "booked";
};

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}
function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}
function prettyDateLabel(iso: string) {
  const today = toYMD(new Date());
  const tomorrow = toYMD(addDays(new Date(), 1));
  if (iso === today) return "Today";
  if (iso === tomorrow) return "Tomorrow";
  const dd = new Date(iso);
  return dd.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}
function format12h(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function VetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<UIMode>("video");
  const [duration, setDuration] = useState<number>(30);

  // Calendly‑style: pick a day first, then times
  const [selectedDate, setSelectedDate] = useState<string>(toYMD(new Date()));
  const [selected, setSelected] = useState<{ date: string; time: string } | null>(null);

  // 7‑day rolling window
  const from = useMemo(() => toYMD(new Date()), []);
  const to = useMemo(() => toYMD(addDays(new Date(), 6)), []);

  // Load profile + next 7 days availability (generated from weekly fixtures)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) {
        navigate("/vets", { replace: true });
        return;
      }
      setLoading(true);
      try {
        const d = await vetsService.getDoctor(id);
        const s = await vetsService.getDoctorSlots(id, { from, to, status: "available" });
        if (!mounted) return;
        setDoctor(d);
        setSlots(s);
        if (d?.modes?.length) setMode(d.modes[0]);
        // Default to first day that actually has slots; else today
        const firstDayWithSlots = s.find((x) => x.status === "available")?.date;
        setSelectedDate(firstDayWithSlots || from);
        // Default duration: smallest available in window
        const allDurations = Array.from(new Set(s.map((x) => x.durationMins))).sort((a, b) => a - b);
        if (allDurations.length) setDuration(allDurations[0]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, navigate, from, to]);

  // Build date strip (7 days)
  const dates = useMemo(() => {
    const arr: string[] = [];
    for (let i = 0; i < 7; i++) arr.push(toYMD(addDays(new Date(from), i)));
    return arr;
  }, [from]);

  // Available durations from loaded slots
  const durations = useMemo(() => {
    const set = new Set<number>();
    slots.forEach((s) => set.add(s.durationMins));
    return Array.from(set).sort((a, b) => a - b);
  }, [slots]);

  // Times for the selected day, filtered by mode+duration
  const daySlots = useMemo(() => {
    return slots
      .filter((s) => s.status === "available")
      .filter((s) => s.date === selectedDate)
      .filter((s) => s.modes.includes(mode))
      .filter((s) => (duration ? s.durationMins === duration : true))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [slots, selectedDate, mode, duration]);

  // Keep selection valid when filters change
  useEffect(() => {
    if (!selected) return;
    const stillExists = daySlots.some((s) => s.date === selected.date && s.time === selected.time);
    if (!stillExists) setSelected(null);
  }, [daySlots, selected]);

  const selectedSlot = useMemo(() => {
    if (!selected) return null;
    return slots.find((x) => x.date === selected.date && x.time === selected.time) || null;
  }, [selected, slots]);

  function onProceed() {
    if (!selected || !doctor || !selectedSlot) return; // require slot selection to proceed
    const fee = selectedSlot.fee;                       // use slot fee only
    const dur = selectedSlot.durationMins;              // use slot duration
    navigate(`/checkout`, {
      state: {
        doctorId: doctor.doctorId,
        doctorName: doctor.displayName,
        date: selected.date,
        time: selected.time,
        durationMins: dur,
        mode,
        fee,
      },
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-sky-700 hover:underline mb-3"
          >
            ← Back to Vets
          </button>

          {/* Doctor header card */}
          <section className="bg-white border rounded-xl p-5 flex gap-4 items-start">
            <img
              src={doctor?.avatarUrl || "https://via.placeholder.com/80"}
              alt={doctor?.displayName || "Doctor"}
              className="w-20 h-20 rounded-full object-cover"
            />
            <div className="flex-1">
              <h1 className="text-xl font-semibold">
                {doctor?.displayName || "Doctor"}
              </h1>
              <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-x-3 gap-y-1">
                <span>{doctor?.experienceYears ?? 0} years experience</span>
                {doctor?.languages?.length ? <span>Languages: {doctor.languages.join(", ")}</span> : null}
                {doctor?.location ? <span>{doctor.location}</span> : null}
              </div>
              {doctor?.specialties?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {doctor.specialties.slice(0, 6).map((sp) => (
                    <span key={sp} className="text-xs px-2 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                      {sp}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          {/* About */}
          <section className="mt-4 bg-white border rounded-xl p-5">
            <div className="flex gap-3 text-sm border-b pb-2">
              <button className="px-3 py-1 rounded bg-gray-100">About Me</button>
              <button className="px-3 py-1 rounded text-gray-500">Reviews</button>
              <button className="px-3 py-1 rounded text-gray-500">Qualifications</button>
            </div>
            <div className="mt-3 text-sm text-gray-700 leading-6">
              {doctor?.bio || "Profile bio will appear here."}
            </div>
          </section>
        </div>

        {/* Booking side panel */}
        <aside className="lg:col-span-1">
          <section className="bg-white border rounded-xl p-5 sticky top-4">
            <div className="text-sm font-medium mb-2">
              {doctor?.displayName || "Doctor"} available on
            </div>

            {/* Date strip (Calendly‑style quick day picker) */}
            <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar">
              {dates.map((d) => {
                const active = selectedDate === d;
                const has = slots.some((s) => s.date === d && s.status === "available");
                return (
                  <button
                    key={d}
                    onClick={() => { setSelectedDate(d); setSelected(null); }}
                    className={`px-3 py-2 rounded border text-sm whitespace-nowrap ${
                      active ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-gray-300 text-gray-700"
                    } ${!has ? "opacity-60" : ""}`}
                    title={prettyDateLabel(d)}
                  >
                    {prettyDateLabel(d)}
                  </button>
                );
              })}
            </div>

            {/* Mode selector */}
            <div className="flex gap-2 mb-3">
              {(["video", "audio", "inPerson"] as UIMode[]).map((m) => {
                const active = mode === m;
                const disabled = doctor?.modes && !doctor.modes.includes(m);
                return (
                  <button
                    key={m}
                    onClick={() => !disabled && setMode(m)}
                    className={`px-3 py-2 rounded border text-sm ${
                      active ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-gray-300 text-gray-700"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {m === "inPerson" ? "In‑Person" : m[0].toUpperCase() + m.slice(1)}
                  </button>
                );
              })}
            </div>

            {/* Duration selector (per event type style) */}
            {durations.length > 1 && (
              <>
                <div className="text-xs text-gray-600 mb-1">Select session duration</div>
                <div className="flex gap-2 mb-3">
                  {durations.map((d) => {
                    const active = duration === d;
                    return (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={`px-3 py-2 rounded border text-sm ${
                          active ? "bg-sky-50 border-sky-300 text-sky-700" : "bg-white border-gray-300 text-gray-700"
                        }`}
                      >
                        {d} mins
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Time slots for selected day */}
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Available times</div>
              <div className="text-gray-400">🗓️</div>
            </div>

            {loading ? (
              <div className="text-xs text-gray-500">Loading slots…</div>
            ) : daySlots.length === 0 ? (
              <div className="text-xs text-gray-500">No matching slots for the selected filters.</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {daySlots.map((s) => {
                  const isSel = selected?.date === s.date && selected?.time === s.time;
                  return (
                    <button
                      key={`${s.date}-${s.time}`}
                      onClick={() => setSelected({ date: s.date, time: s.time })}
                      className={`px-3 py-2 rounded border text-sm ${
                        isSel ? "bg-teal-600 text-white border-teal-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                      title={`${format12h(s.time)} • ₹${s.fee}`}
                    >
                      {format12h(s.time)}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Fee + actions */}
            <div className="mt-6">
              <div className="text-sm text-gray-600">Consultation Fee</div>
              <div className="text-lg font-semibold">
                {selectedSlot ? `₹${selectedSlot.fee}` : "Select a time"}
                {selectedSlot ? <span className="text-sm text-gray-500"> / session</span> : null}
              </div>
            </div>

            <button
              onClick={onProceed}
              disabled={!selected || !selectedSlot || loading}
              className="mt-3 w-full px-3 py-2 rounded bg-teal-600 text-white disabled:opacity-50"
            >
              Proceed
            </button>

            <button
              className="mt-2 w-full px-3 py-2 rounded border text-teal-700 border-teal-200 bg-white"
            >
              Send Message
            </button>
          </section>
        </aside>
      </main>
    </div>
  );
}
