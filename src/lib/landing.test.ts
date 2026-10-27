import { describe, expect, it } from "vitest";
import {
  cardProgress,
  CARD_TRAVEL,
  easeInOut,
  formatCounter,
  projectPins,
  scrollProgress,
} from "@/lib/landing";

describe("easeInOut", () => {
  it("runs from 0 to 1 and stays in range", () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
    expect(easeInOut(-3)).toBe(0);
    expect(easeInOut(7)).toBe(1);
  });
  it("starts slowly", () => {
    expect(easeInOut(0.1)).toBeLessThan(0.1);
  });
});

describe("cardProgress", () => {
  it("has not moved before it starts, and has arrived at the end", () => {
    expect(cardProgress(0)).toBe(0);
    expect(cardProgress(CARD_TRAVEL.start)).toBe(0);
    expect(cardProgress(CARD_TRAVEL.end)).toBe(1);
    expect(cardProgress(CARD_TRAVEL.end + 5)).toBe(1);
  });
});

describe("formatCounter", () => {
  it("counts up to the number of post offices with three digits", () => {
    expect(formatCounter(0, 99)).toBe("000");
    expect(formatCounter(0.5, 99)).toBe("050");
    expect(formatCounter(1, 99)).toBe("099");
  });
  it("never goes past the total or below zero", () => {
    expect(formatCounter(2, 99)).toBe("099");
    expect(formatCounter(-1, 99)).toBe("000");
    expect(formatCounter(1, 0)).toBe("000");
  });
});

describe("scrollProgress", () => {
  it("follows the scroll position and finishes before the end", () => {
    expect(scrollProgress(0, 1000)).toBe(0);
    expect(scrollProgress(350, 1000)).toBeCloseTo(0.5);
    expect(scrollProgress(700, 1000)).toBe(1);
    expect(scrollProgress(1000, 1000)).toBe(1);
  });
  it("is zero when there is nothing to scroll", () => {
    expect(scrollProgress(50, 0)).toBe(0);
  });
});

describe("projectPins", () => {
  const offices = [
    { id: 1, lat: 12, lng: 74 },
    { id: 2, lat: 18, lng: 78 },
    { id: 3, lat: 15, lng: 76 },
    { id: 4, lat: null, lng: null },
  ];

  it("keeps real positions: north is up and east is right", () => {
    const pins = projectPins(offices, 10);
    const byId = Object.fromEntries(pins.map((pin) => [pin.id, pin]));
    expect(byId[1]).toEqual({ id: 1, x: 10, y: 90 }); // south-west corner
    expect(byId[2]).toEqual({ id: 2, x: 90, y: 10 }); // north-east corner
    expect(byId[3]).toEqual({ id: 3, x: 50, y: 50 });
  });

  it("leaves out post offices without coordinates", () => {
    expect(projectPins(offices).map((pin) => pin.id)).toEqual([1, 2, 3]);
  });

  it("handles no offices and a single office", () => {
    expect(projectPins([])).toEqual([]);
    expect(projectPins([{ id: 9, lat: 12, lng: 77 }])).toEqual([{ id: 9, x: 50, y: 50 }]);
  });
});
