import { describe, expect, it } from "vitest";
import { liveStates, resolveState, stateName } from "@/lib/states";

// KL stands in for a state that is simply live; TN is currently in COMING_SOON_STATES.
const offices = [{ state: "KA" }, { state: "KA" }, { state: "KL" }];

describe("states", () => {
  it("lists live states with counts, by name", () => {
    expect(liveStates(offices)).toEqual([
      { code: "KA", name: "Karnataka", count: 2 },
      { code: "KL", name: "Kerala", count: 1 },
    ]);
  });
  it("leaves out a state that is still coming soon, even with offices loaded", () => {
    expect(liveStates([{ state: "KA" }, { state: "TN" }])).toEqual([
      { code: "KA", name: "Karnataka", count: 2 - 1 },
    ]);
  });
  it("falls back to the code for unknown states", () => {
    expect(stateName("ZZ")).toBe("ZZ");
  });
  it("keeps a valid stored choice, otherwise Karnataka, otherwise the first", () => {
    const live = liveStates(offices);
    expect(resolveState("KL", live)).toBe("KL");
    expect(resolveState("MH", live)).toBe("KA");
    expect(resolveState(null, liveStates([{ state: "KL" }]))).toBe("KL");
  });
});
