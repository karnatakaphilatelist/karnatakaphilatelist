import { afterEach, describe, expect, it, vi } from "vitest";
import { setPlatform, stampEvents, trackEvent } from "@/lib/analytics";

type TestWindow = Window & { gtag?: (...args: unknown[]) => void };

afterEach(() => {
  delete (window as TestWindow).gtag;
});

describe("trackEvent", () => {
  it("does nothing when the tag is not loaded", () => {
    expect(() => trackEvent("tour_complete")).not.toThrow();
  });

  it("sends the event name and details to gtag", () => {
    const gtag = vi.fn();
    (window as TestWindow).gtag = gtag;
    trackEvent("stamp_collected", { stamp_number: 2 });
    expect(gtag).toHaveBeenCalledWith("event", "stamp_collected", {
      stamp_number: 2,
    });
  });

  it("never throws if gtag does", () => {
    (window as TestWindow).gtag = () => {
      throw new Error("blocked");
    };
    expect(() => trackEvent("tour_complete")).not.toThrow();
  });
});

describe("setPlatform", () => {
  it("sets the platform user property", () => {
    const gtag = vi.fn();
    (window as TestWindow).gtag = gtag;
    setPlatform("app");
    expect(gtag).toHaveBeenCalledWith("set", "user_properties", {
      platform: "app",
    });
  });
});

describe("stampEvents", () => {
  it("marks the first and third stamps as milestones", () => {
    expect(stampEvents(1)).toEqual(["stamp_collected", "first_stamp"]);
    expect(stampEvents(2)).toEqual(["stamp_collected"]);
    expect(stampEvents(3)).toEqual(["stamp_collected", "third_stamp"]);
    expect(stampEvents(4)).toEqual(["stamp_collected"]);
  });
});
