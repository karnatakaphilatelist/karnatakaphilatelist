import { describe, expect, it } from "vitest";
import { ISO_DATE_PATTERN, todayIso, toIsoDate } from "@/lib/date";

describe("toIsoDate", () => {
  it("pads month and day", () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("uses the local calendar day, not UTC", () => {
    // 23:30 local on 31 Oct is still 31 Oct, even where UTC has already rolled over.
    expect(toIsoDate(new Date(2026, 9, 31, 23, 30))).toBe("2026-10-31");
  });
});

describe("todayIso", () => {
  it("returns a YYYY-MM-DD string", () => {
    expect(todayIso()).toMatch(ISO_DATE_PATTERN);
  });

  it("formats the date it is given", () => {
    expect(todayIso(new Date(2026, 9, 27))).toBe("2026-10-27");
  });
});
