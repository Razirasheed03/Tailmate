const IST = "Asia/Kolkata";

/** Normalize "H:mm", "HH:mm", or "H:mm AM/PM" to HH:mm (24h) */
export function normalizeTimeString(time?: string): string {
  if (!time || typeof time !== "string") return "00:00";
  const trimmed = time.trim();

  const ampm = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (ampm) {
    let h = Number(ampm[1]);
    const m = Number(ampm[2]);
    const mer = ampm[3].toLowerCase();
    if (mer === "pm" && h < 12) h += 12;
    if (mer === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "00:00";
  const h = Math.min(23, Math.max(0, Number(match[1])));
  const m = Math.min(59, Math.max(0, Number(match[2])));
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** e.g. "Fri, 22 May 2026" */
export function formatDateIST(date: string): string {
  const dt = new Date(`${date}T12:00:00+05:30`);
  if (Number.isNaN(dt.getTime())) return date;
  return dt.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: IST,
  });
}

/** Parse booking date + time as IST instant */
export function parseBookingDateTimeIST(date: string, time?: string): Date {
  const t = normalizeTimeString(time);
  return new Date(`${date}T${t}:00+05:30`);
}

/** e.g. "10:30 AM" */
export function formatTimeIST(date: string, time?: string): string {
  const dt = parseBookingDateTimeIST(date, time);
  if (Number.isNaN(dt.getTime())) return time || "—";
  return dt.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: IST,
  });
}

/** Time-only string (availability slots) in IST display */
export function formatTimeStringIST(time?: string): string {
  const t = normalizeTimeString(time);
  const dt = new Date(`1970-01-01T${t}:00+05:30`);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: IST,
  });
}

/** e.g. "Fri, 22 May 2026, 10:30 AM" */
export function formatBookingDateTimeIST(date: string, time?: string): string {
  const dt = parseBookingDateTimeIST(date, time);
  if (Number.isNaN(dt.getTime())) return `${date} ${time || ""}`.trim();
  return dt.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: IST,
  });
}
