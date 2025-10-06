// src/pages/doctor/Appointments.tsx
import { useEffect, useMemo, useState } from "react";
import DoctorSidebar from "@/components/UiComponents/DoctorSidebar";
import { doctorAvailabilityService } from "@/services/doctorAvailabilityService";

type UIMode = "video" | "audio" | "inPerson";
type VerificationStatus = "pending" | "verified" | "rejected";

type TimeFixture = { time: string; fee: number; modes: UIMode[] };
type WeekdayFixtures = {
  weekday: number;
  enabled: boolean;
  slotLengthMins: number;
  fixtures: TimeFixture[];
};

type GeneratedSlot = {
  date?: string;
  time?: string;
  durationMins?: number;
  modes?: UIMode[];
  fee?: number;
};

const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function toYMD(d: Date) {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2, "0"), dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}
function fmtTime(time?: string) {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return "—";
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr), m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "—";
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm} ${ampm}`;
}
function hmToMins(hhmm: string) { const [h, m] = hhmm.split(":").map(Number); return Number.isFinite(h) && Number.isFinite(m) ? h*60+m : NaN; }
function minsToHM(mins: number) { const h = Math.floor(mins/60), m = mins%60; return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`; }

export default function Appointments() {
  const [verificationStatus] = useState<VerificationStatus>("verified");
  const isVerified = verificationStatus === "verified";

  const [rules, setRules] = useState<WeekdayFixtures[]>(
    Array.from({ length: 7 }, (_, w) => ({
      weekday: w,
      enabled: false,
      slotLengthMins: 30,
      fixtures: [],
    }))
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWeekday, setSelectedWeekday] = useState<number>(1);

  // Template controls (applied to all chosen days)
  const [tplStart, setTplStart] = useState("09:00");
  const [tplEnd, setTplEnd] = useState("17:00");
  const [tplFee, setTplFee] = useState(800);
  const [tplModes, setTplModes] = useState<UIMode[]>(["video"]);
  const [applyTo, setApplyTo] = useState<Set<number>>(() => new Set([1,2,3,4,5])); // default Mon–Fri

  const today = useMemo(() => new Date(), []);
  const from = useMemo(() => toYMD(today), [today]);
  const to = useMemo(() => toYMD(addDays(today, 6)), [today]);

  const [preview, setPreview] = useState<Record<string, GeneratedSlot[]>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load rules
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const serverRules = await doctorAvailabilityService.getWeeklyRules();
        if (mounted && Array.isArray(serverRules) && serverRules.length) {
          setRules((prev) => {
            const next = [...prev];
            serverRules.forEach((r: any) => {
              const w = Number(r.weekday);
              if (w < 0 || w > 6) return;
              const fixtures: TimeFixture[] = Array.isArray(r.fixtures)
                ? r.fixtures.map((f: any) => ({
                    time: String(f.time),
                    fee: Number(f.fee) || 0,
                    modes: Array.isArray(f.modes) && f.modes.length ? f.modes : ["video"],
                  }))
                : [];
              next[w] = {
                weekday: w,
                enabled: !!r.enabled,
                slotLengthMins: Number(r.slotLengthMins) || 30,
                fixtures: fixtures.sort((a, b) => a.time.localeCompare(b.time)),
              };
            });
            return next;
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Preview
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const payload = rules.map(r => ({
          weekday: r.weekday,
          enabled: r.enabled,
          slotLengthMins: r.slotLengthMins,
          fixtures: r.fixtures
        }));
        const previewMap = await doctorAvailabilityService.getGeneratedAvailability(from, to, payload);
        setPreview(previewMap || {});
      } catch {
        setPreview({});
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [rules, from, to]);

  // Helpers to apply template windows into fixtures for a specific day
  function expandWindowToFixtures(step: number, start: string, end: string, fee: number, modes: UIMode[]): TimeFixture[] {
    const s = hmToMins(start), e = hmToMins(end);
    if (!Number.isFinite(s) || !Number.isFinite(e) || s >= e) return [];
    const out: TimeFixture[] = [];
    for (let t = s; t + step <= e; t += step) {
      out.push({ time: minsToHM(t), fee: Number(fee) || 0, modes: [...modes] });
    }
    return out;
  }

  function applyTemplate(kind: "wk_9_5" | "wk_morning" | "wk_evening" | "clear") {
    let start = tplStart, end = tplEnd;
    if (kind === "wk_9_5") { start = "09:00"; end = "17:00"; }
    if (kind === "wk_morning") { start = "09:00"; end = "12:00"; }
    if (kind === "wk_evening") { start = "14:00"; end = "18:00"; }

    setRules((list) => {
      const next = [...list];
      for (let w = 0; w < 7; w++) {
        if (!applyTo.has(w)) continue;
        if (kind === "clear") {
          next[w] = { ...next[w], fixtures: [], enabled: false };
          continue;
        }
        const step = Number(next[w].slotLengthMins) || 30;
        const fixtures = expandWindowToFixtures(step, start, end, tplFee, tplModes);
        next[w] = {
          ...next[w],
          fixtures: fixtures.sort((a, b) => a.time.localeCompare(b.time)),
          enabled: fixtures.length > 0 ? true : next[w].enabled,
        };
      }
      return next;
    });
  }

  function toggleApplyDay(w: number) {
    setApplyTo((s) => {
      const n = new Set(s);
      if (n.has(w)) n.delete(w); else n.add(w);
      return n;
    });
  }

  // Basic per-day edits inside modal (add/remove a single time)
  const [newTime, setNewTime] = useState<string>("09:00");
  const [newFee, setNewFee] = useState<number>(tplFee);

  function addFixtureToDay(w: number) {
    const t = newTime.trim();
    if (!/^\d{2}:\d{2}$/.test(t)) return;
    setRules((list) => {
      const next = [...list];
      const day = { ...next[w] };
      if (!day.fixtures.some((f) => f.time === t)) {
        day.fixtures = [...day.fixtures, { time: t, fee: Number(newFee) || 0, modes: [...tplModes] }].sort((a,b)=>a.time.localeCompare(b.time));
        day.enabled = true;
      }
      next[w] = day;
      return next;
    });
    setNewTime("09:00");
  }
  function removeFixtureFromDay(w: number, t: string) {
    setRules((list) => {
      const next = [...list];
      const day = { ...next[w] };
      day.fixtures = day.fixtures.filter((f) => f.time !== t);
      if (day.fixtures.length === 0) day.enabled = false;
      next[w] = day;
      return next;
    });
  }

  // Save rules
  async function save() {
    setSaving(true);
    try {
      const payload = rules.map(r => ({
        weekday: r.weekday,
        enabled: r.enabled,
        slotLengthMins: r.slotLengthMins,
        fixtures: r.fixtures
      }));
      await doctorAvailabilityService.saveWeeklyRules(payload);
      // refresh (optional)
      const refreshed = await doctorAvailabilityService.getWeeklyRules();
      if (Array.isArray(refreshed) && refreshed.length) {
        setRules((prev) => {
          const next = [...prev];
          refreshed.forEach((r: any) => {
            const w = Number(r.weekday);
            if (w < 0 || w > 6) return;
            const fixtures: TimeFixture[] = Array.isArray(r.fixtures)
              ? r.fixtures.map((f: any) => ({
                  time: String(f.time),
                  fee: Number(f.fee) || 0,
                  modes: Array.isArray(f.modes) && f.modes.length ? f.modes : ["video"],
                }))
              : [];
            next[w] = {
              weekday: w,
              enabled: !!r.enabled,
              slotLengthMins: Number(r.slotLengthMins) || 30,
              fixtures: fixtures.sort((a, b) => a.time.localeCompare(b.time)),
            };
          });
          return next;
        });
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex">
      <DoctorSidebar isVerified={isVerified} />
      <main className="flex-1 p-6 space-y-6 bg-gray-50">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Weekly Availability</h1>
            <p className="text-sm text-gray-500">Set a simple weekly schedule with per‑time pricing and modes; disabled days are treated as leave.</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="px-4 py-2 rounded bg-black text-white">Edit weekly schedule</button>
        </header>

        <section className="bg-white border rounded p-4">
          <div className="text-sm font-medium mb-3">Preview (generated): {from} → {to}</div>
          {loading ? (
            <div className="text-xs text-gray-500">Generating…</div>
          ) : (
            <div className="space-y-3">
              {Array.from({ length: 7 }, (_, i) => {
                const d = addDays(today, i);
                const ymd = toYMD(d);
                const list = (preview?.[ymd] || []).slice().sort((a, b) => (a?.time || "").localeCompare(b?.time || ""));
                return (
                  <div key={ymd}>
                    <div className="text-xs text-gray-500 mb-1">
                      {d.toDateString()} • {list.length} slot{list.length === 1 ? "" : "s"}
                    </div>
                    {list.length === 0 ? (
                      <div className="text-xs text-gray-400">No slots</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {list.map((s, idx) => (
                          <span key={ymd + (s?.time || "") + idx} className="text-xs px-2 py-1 rounded border bg-gray-50">
                            {fmtTime(s?.time)} • {Number(s?.durationMins || 0)}m • ₹{Number(s?.fee || 0)} • {(s?.modes || []).join(", ")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-4xl rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Weekly schedule (simple)</h2>
              <button onClick={() => setModalOpen(false)} className="text-sm text-gray-600 hover:text-black">✕</button>
            </div>

            {/* Templates row */}
            <div className="border rounded p-3 mb-3">
              <div className="text-xs text-gray-600 mb-2">Apply a template to selected days</div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => applyTemplate("wk_9_5")} className="px-3 py-1.5 text-sm border rounded">Weekdays 9–5</button>
                <button onClick={() => applyTemplate("wk_morning")} className="px-3 py-1.5 text-sm border rounded">Weekdays 9–12</button>
                <button onClick={() => applyTemplate("wk_evening")} className="px-3 py-1.5 text-sm border rounded">Weekdays 14–18</button>
                <button onClick={() => applyTemplate("clear")} className="px-3 py-1.5 text-sm border rounded">Clear week</button>

                <span className="mx-2 h-6 w-px bg-gray-200" />

                <label className="text-xs text-gray-500">Custom start</label>
                <input type="time" className="border rounded px-2 py-1 text-sm" value={tplStart} onChange={(e)=>setTplStart(e.target.value)} />
                <label className="text-xs text-gray-500">end</label>
                <input type="time" className="border rounded px-2 py-1 text-sm" value={tplEnd} onChange={(e)=>setTplEnd(e.target.value)} />
                <label className="text-xs text-gray-500">fee</label>
                <input type="number" className="border rounded px-2 py-1 w-24 text-sm" value={tplFee} onChange={(e)=>setTplFee(Number(e.target.value)||0)} />

                <div className="flex gap-1">
                  {(["video","audio","inPerson"] as UIMode[]).map(m => {
                    const active = tplModes.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setTplModes(prev => prev.includes(m) ? prev.filter(x=>x!==m) : [...prev,m])}
                        className={`px-2 py-1 rounded border text-xs ${active ? "bg-sky-50 border-sky-300 text-sky-700" : "bg-white border-gray-300 text-gray-700"}`}
                      >
                        {m === "inPerson" ? "In‑P" : m[0].toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {WEEKDAYS.map((d, idx) => {
                  const on = applyTo.has(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleApplyDay(idx)}
                      className={`px-2 py-1 rounded border text-xs ${on ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-gray-300 text-gray-700"}`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Per-day quick edit (enable = working; disabled = leave) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-auto pr-1">
              {rules.map((day) => (
                <div key={day.weekday} className="border rounded p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{WEEKDAYS[day.weekday]}</div>
                    <label className="inline-flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={day.enabled}
                        onChange={(e) =>
                          setRules(list => {
                            const next = [...list];
                            next[day.weekday] = { ...next[day.weekday], enabled: e.target.checked };
                            return next;
                          })
                        }
                      />
                      Enabled
                    </label>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-[11px] text-gray-500">Slot length</label>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={day.slotLengthMins}
                      onChange={(e) =>
                        setRules(list => {
                          const next = [...list];
                          next[day.weekday] = { ...next[day.weekday], slotLengthMins: Number(e.target.value) };
                          return next;
                        })
                      }
                    >
                      <option value={15}>15</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                      <option value={45}>45</option>
                      <option value={60}>60</option>
                    </select>
                  </div>

                  {/* Quick add single time using current template fee/modes */}
                  <div className="mt-2 flex items-center gap-2">
                    <input type="time" className="border rounded px-2 py-1 text-sm" value={newTime} onChange={(e)=>setNewTime(e.target.value)} />
                    <input type="number" className="border rounded px-2 py-1 w-20 text-sm" value={newFee} onChange={(e)=>setNewFee(Number(e.target.value)||0)} />
                    <button className="px-2 py-1 border rounded text-xs" onClick={()=>addFixtureToDay(day.weekday)}>Add</button>
                  </div>

                  {day.fixtures.length === 0 ? (
                    <div className="mt-2 text-xs text-gray-400">No times</div>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {day.fixtures.map((f) => (
                        <span key={`${day.weekday}-${f.time}`} className="inline-flex items-center gap-2 border rounded bg-gray-50 px-2 py-1 text-xs">
                          {fmtTime(f.time)} • ₹{f.fee} • {f.modes.join(", ")}
                          <button className="text-gray-500 hover:text-red-600" onClick={()=>removeFixtureFromDay(day.weekday, f.time)} title="Remove">✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="px-3 py-2 rounded border text-sm">Close</button>
              <button onClick={save} disabled={saving} className="px-3 py-2 rounded bg-black text-white text-sm disabled:opacity-50">
                {saving ? "Saving..." : "Save weekly schedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
