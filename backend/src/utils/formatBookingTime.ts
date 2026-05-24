const IST = "Asia/Kolkata";

function normalizeTime(time?: string): string {
  if (!time || typeof time !== "string") return "00:00";
  const match = time.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "00:00";
  const h = Math.min(23, Math.max(0, Number(match[1])));
  const m = Math.min(59, Math.max(0, Number(match[2])));
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatBookingSlotMessageIST(date: string, time?: string): string {
  const t = normalizeTime(time);
  const dt = new Date(`${date}T${t}:00+05:30`);
  if (Number.isNaN(dt.getTime())) return `${date} ${t}`;
  const datePart = dt.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: IST,
  });
  const timePart = dt.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: IST,
  });
  return `${datePart} ${timePart}`;
}
