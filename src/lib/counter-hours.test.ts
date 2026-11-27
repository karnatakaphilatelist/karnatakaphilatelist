import { describe, expect, it } from "vitest";
import { counterStatus } from "./counter-hours";

// 2026-11-27 is a Friday. IST = UTC+5:30.
const ist = (day: number, h: number, m = 0) => new Date(Date.UTC(2026, 10, day, h, m) - 330 * 60_000);

describe("counterStatus", () => {
  it("open during the day, lunch at 1 PM, closed after 5 PM and before 9 AM", () => {
    expect(counterStatus(ist(27, 11)).word).toBe("OPEN");
    expect(counterStatus(ist(27, 13, 15)).word).toBe("LUNCH");
    expect(counterStatus(ist(27, 17, 0)).word).toBe("CLOSED");
    expect(counterStatus(ist(27, 8, 59)).word).toBe("CLOSED");
    expect(counterStatus(ist(27, 11)).hours).toBe("9 AM – 5 PM");
  });
  it("Saturday ends at 1 PM; Sunday is closed", () => {
    expect(counterStatus(ist(28, 11)).word).toBe("OPEN");
    expect(counterStatus(ist(28, 13, 30)).word).toBe("CLOSED");
    expect(counterStatus(ist(29, 11)).word).toBe("CLOSED");
  });
  it("uses Indian time whatever the device timezone", () => {
    expect(counterStatus(new Date(Date.UTC(2026, 10, 27, 9, 0))).word).toBe("OPEN"); // 14:30 IST
  });
});
