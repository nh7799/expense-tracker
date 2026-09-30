/** expense_date is a plain DATE in the user's timezone, so day totals never depend on UTC or DST. */
export const DEFAULT_TZ = "Europe/London";

function pad2(n: string | number): string {
  return String(n).padStart(2, "0");
}

export function getTodayInUserTimezone(tz = DEFAULT_TZ, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

export function getCurrentTimeInUserTimezone(tz = DEFAULT_TZ, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = pad2(parts.find((p) => p.type === "hour")?.value ?? "00");
  const minute = pad2(parts.find((p) => p.type === "minute")?.value ?? "00");
  return `${hour}:${minute}`;
}

/** Pure calendar arithmetic on YYYY-MM-DD (UTC math, immune to DST). */
export function shiftDate(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Inclusive start / exclusive end DATE bounds for a month, e.g. "2026-09" */
export function monthBounds(ym: string): { start: string; end: string } {
  const [y, m] = ym.split("-").map(Number);
  return { start: `${ym}-01`, end: new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10) };
}

export function isValidYmd(ymd: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function formatExpenseDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" })
    .format(new Date(Date.UTC(y, m - 1, d)));
}
