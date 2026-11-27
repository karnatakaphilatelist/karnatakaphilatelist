import { describe, expect, it } from "vitest";
import { counterStatus } from "./counter-hours";

// 2026-11-27 is a Friday. IST = UTC+5:30, so 11:00 IST = 05:30Z.
const ist = (day: number, h: number, m = 0) => new Date(Date.UTC(2026, 10, day, h, m) - 330 * 60_000);

describe("counterStatus", () => {
  it("is open mid-morning on a weekday", () => {
    expect(counterStatus(ist(27, 11)).state).toBe("open");
  });
  it("flags the lunch window", () => {
    expect(counterStatus(ist(27, 13, 10)).state).toBe("lunch");
  });
  it("warns shortly before the stamp cutoff", () => {
    expect(counterStatus(ist(27, 14, 40)).state).toBe("closing");
  });
  it("says the stamp counter has probably closed at 3:15 PM", () => {
    const s = counterStatus(ist(27, 15, 15));
    expect(s.state).toBe("stamps-closed");
    expect(s.label).toContain("3 PM");
  });
  it("is closed after 4 PM and before 10 AM", () => {
    expect(counterStatus(ist(27, 16, 30)).state).toBe("closed");
    expect(counterStatus(ist(27, 9, 0)).state).toBe("closed");
  });
  it("closes at 1 PM on Saturday and all day Sunday", () => {
    expect(counterStatus(ist(28, 11)).state).toBe("open");
    expect(counterStatus(ist(28, 13, 30)).state).toBe("closed");
    expect(counterStatus(ist(29, 11)).state).toBe("closed");
  });
  it("uses Indian time whatever the device timezone", () => {
    // 09:00Z is 14:30 IST on a Friday.
    expect(counterStatus(new Date(Date.UTC(2026, 10, 27, 9, 0))).state).toBe("closing");
  });
});
