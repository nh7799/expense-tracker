import { describe, it, expect } from "vitest";
import { parseMoneyToMinorUnits as p, formatMinorUnits as f, addMoney } from "./index";

describe("money", () => {
  it("parses exactly", () => {
    expect(p("1")).toBe(100); expect(p("1.5")).toBe(150); expect(p("0.01")).toBe(1);
    expect(p("£100.99")).toBe(10099); expect(p("999.99")).toBe(99999);
  });
  it("rejects bad input", () => {
    for (const s of ["0", "0.00", "-1", "1.234", "abc", "", "1e3"]) expect(() => p(s)).toThrow();
  });
  it("adds and formats without float drift", () => {
    expect(addMoney(p("0.10"), p("0.20"))).toBe(30);
    expect(f(1525)).toBe("£15.25"); expect(f(1)).toBe("£0.01");
  });
});
