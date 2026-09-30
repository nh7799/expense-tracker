import { describe, expect, it } from "vitest";
import { formatExpenseDate, isValidYmd, monthBounds, shiftDate } from "./index";

describe("dates", () => {
  it("shifts across month boundaries without DST issues", () => {
    expect(shiftDate("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDate("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("rejects impossible calendar dates", () => {
    expect(isValidYmd("2026-02-31")).toBe(false);
    expect(isValidYmd("2026-09-30")).toBe(true);
  });

  it("computes exclusive month end", () => {
    expect(monthBounds("2026-09")).toEqual({ start: "2026-09-01", end: "2026-10-01" });
  });

  it("formats a calendar date in en-GB", () => {
    expect(formatExpenseDate("2026-09-30")).toContain("30");
  });
});
