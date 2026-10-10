import { describe, expect, it } from "vitest";
import { directionsUrl, distanceKm, formatDistance } from "@/lib/geo";

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
      "https://www.google.com/maps/dir/?api=1&destination=12.5,76.25",
    );
  });
});
