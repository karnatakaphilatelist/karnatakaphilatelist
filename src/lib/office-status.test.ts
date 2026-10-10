import { describe, expect, it } from "vitest";
import {
  getOfficeStatus,
  hasCoordinates,
  sortByDistance,
  withStatus,
} from "@/lib/office-status";
import type { PostOffice, Visit } from "@/types";

const office = (id: number, lat: number | null, lng: number | null): PostOffice => ({
  id,
  name: `Office ${id}`,
  pincode: "560001",
  district: "Bengaluru Urban",
  lat,
  lng,
});

const visit = (officeId: number): Visit => ({
  officeId,
  visitedAt: "2026-10-11",
  note: "",
  photoPath: null,
  isPublic: false,
});

describe("getOfficeStatus", () => {
  it("prefers visited over planned", () => {
    expect(getOfficeStatus(1, { 1: visit(1) }, new Set([1]))).toBe("visited");
  });

  it("reports planned and unvisited offices", () => {
    expect(getOfficeStatus(2, {}, new Set([2]))).toBe("planned");
    expect(getOfficeStatus(3, {}, new Set())).toBe("unvisited");
  });
});

describe("withStatus and sortByDistance", () => {
  const offices = [office(1, 12.2958, 76.6394), office(2, 12.9716, 77.5946), office(3, null, null)];
  const nearBengaluru = { lat: 12.97, lng: 77.59 };

  it("leaves distance empty until the user's location is known", () => {
    expect(withStatus(offices, {}, new Set(), null).every((o) => o.distanceKm === null)).toBe(true);
  });

  it("sorts nearest first and puts offices without coordinates last", () => {
    const sorted = sortByDistance(withStatus(offices, {}, new Set(), nearBengaluru));
    expect(sorted.map((o) => o.id)).toEqual([2, 1, 3]);
  });
});

describe("hasCoordinates", () => {
  it("is false when either coordinate is missing", () => {
    expect(hasCoordinates(office(1, null, 76))).toBe(false);
    expect(hasCoordinates(office(1, 12, null))).toBe(false);
    expect(hasCoordinates(office(1, 12, 76))).toBe(true);
  });
});
