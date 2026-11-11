import { describe, expect, it } from "vitest";
import {
  AT_OFFICE_KM,
  directionsUrl,
  distanceKm,
  formatDistance,
  formatShortDistance,
  proximity,
} from "@/lib/geo";

describe("distanceKm", () => {
  it("is zero for the same point", () => {
    const point = { lat: 12.9716, lng: 77.5946 };
    expect(distanceKm(point, point)).toBe(0);
  });

  it("matches the known Bengaluru to Mysuru distance", () => {
    const bengaluru = { lat: 12.9716, lng: 77.5946 };
    const mysuru = { lat: 12.2958, lng: 76.6394 };
    // Straight-line distance is roughly 126 km.
    expect(distanceKm(bengaluru, mysuru)).toBeCloseTo(126, -1);
  });
});

describe("formatDistance", () => {
  it("keeps one decimal for short distances", () => {
    expect(formatDistance(2.46)).toBe("2.5 km");
  });

  it("rounds long distances to whole kilometres", () => {
    expect(formatDistance(126.4)).toBe("126 km");
  });
});

describe("directionsUrl", () => {
  it("targets the given coordinates", () => {
    expect(directionsUrl({ lat: 12.5, lng: 76.25 })).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=12.5,76.25"
    );
  });
});

describe("proximity", () => {
  it("is unknown without a location", () => {
    expect(proximity(null)).toBe("unknown");
  });
  it("counts within 150 m as here", () => {
    expect(proximity(0.1)).toBe("here");
    expect(proximity(AT_OFFICE_KM)).toBe("here");
    expect(proximity(0.4)).toBe("away");
  });
  it("shows short distances in metres", () => {
    expect(formatShortDistance(0.06)).toBe("60 m");
    expect(formatShortDistance(0.004)).toBe("10 m");
  });
});
