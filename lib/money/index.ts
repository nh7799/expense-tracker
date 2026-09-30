/** All money is integer minor units (pence). Never use floats for arithmetic. */
export const MAX_MINOR = 100_000_000; // £1,000,000.00

export function parseMoneyToMinorUnits(input: string): number {
  const s = input.trim().replace(/^£/, "").replace(/,/g, "").trim();
  const m = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) throw new Error("Enter a valid amount, e.g. 12.50");
  const minor = Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0") || "0");
  if (minor <= 0) throw new Error("Amount must be greater than zero");
  if (minor > MAX_MINOR) throw new Error("Amount is too large");
  return minor;
}

export function formatMinorUnits(minor: number, currency = "GBP"): string {
  if (!Number.isSafeInteger(minor)) throw new Error("Invalid minor units");
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  const whole = Math.trunc(abs / 100).toLocaleString("en-GB");
  const symbol = currency === "GBP" ? "£" : `${currency} `;
  return `${sign}${symbol}${whole}.${String(abs % 100).padStart(2, "0")}`;
}

export const minorToPlain = (minor: number) => formatMinorUnits(minor).replace(/[£,]/g, ""); // CSV: "12.50"
export const addMoney = (a: number, b: number) => safe(a + b);
export const subtractMoney = (a: number, b: number) => safe(a - b);
export const sumMoney = (xs: number[]) => xs.reduce(addMoney, 0);

function safe(n: number) {
  if (!Number.isSafeInteger(n)) throw new Error("Money overflow");
  return n;
}
