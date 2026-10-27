import { describe, expect, it } from "vitest";
import { parseGuestVisits, parsePlannedIds } from "@/lib/visits/guest-visits";

const valid = {
  officeId: 4,
  visitedAt: "2026-10-01",
  note: "Nice counter",
  photoPath: null,
  isPublic: true,
};

describe("parseGuestVisits", () => {
  it("keeps well-formed visits", () => {
    expect(parseGuestVisits([valid])).toEqual([valid]);
  });

  it("returns nothing when the stored value is not a list", () => {
    expect(parseGuestVisits(null)).toEqual([]);
    expect(parseGuestVisits({ officeId: 1 })).toEqual([]);
    expect(parseGuestVisits("oops")).toEqual([]);
  });

  it("drops rows with a missing, fractional or non-positive office id", () => {
    const rows = [
      { ...valid, officeId: undefined },
      { ...valid, officeId: "7" },
      { ...valid, officeId: 1.5 },
      { ...valid, officeId: 0 },
      { ...valid, officeId: -3 },
      null,
      42,
    ];
    expect(parseGuestVisits(rows)).toEqual([]);
  });

  it("repairs a bad date and over-long note instead of losing the stamp", () => {
    const [visit] = parseGuestVisits([
      { ...valid, visitedAt: "yesterday", note: "x".repeat(1500) },
    ]);
    expect(visit.visitedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(visit.note).toHaveLength(1000);
  });

  it("never carries a photo path or a truthy-but-wrong privacy value", () => {
    const [visit] = parseGuestVisits([{ ...valid, photoPath: "a/b.jpg", isPublic: "yes" }]);
    expect(visit.photoPath).toBeNull();
    expect(visit.isPublic).toBe(false);
  });

  it("keeps one visit per office", () => {
    const visits = parseGuestVisits([valid, { ...valid, note: "later" }]);
    expect(visits).toHaveLength(1);
    expect(visits[0].note).toBe("later");
  });
});

describe("parsePlannedIds", () => {
  it("keeps whole numbers only", () => {
    expect(parsePlannedIds([1, "2", 3.5, null, 4])).toEqual([1, 4]);
  });

  it("returns nothing for a non-list", () => {
    expect(parsePlannedIds(7)).toEqual([]);
    expect(parsePlannedIds(undefined)).toEqual([]);
  });
});
