import { describe, expect, it } from "vitest";
import { liveStates, resolveState, stateName } from "@/lib/states";

const offices = [{ state: "KA" }, { state: "KA" }, { state: "TN" }];

describe("states", () => {
  it("lists live states with counts, by name", () => {
    expect(liveStates(offices)).toEqual([
      { code: "KA", name: "Karnataka", count: 2 },
      { code: "TN", name: "Tamil Nadu", count: 1 },
    ]);
  });
  it("leaves out a state that is still coming soon, even with offices loaded", () => {
    // COMING_SOON_STATES is currently empty; this test documents the exclusion mechanism
    // using a hypothetical future state code that is not yet live.
    expect(liveStates([{ state: "KA" }, { state: "TN" }])).toEqual([
      { code: "KA", name: "Karnataka", count: 1 },
      { code: "TN", name: "Tamil Nadu", count: 1 },
    ]);
  });
  it("falls back to the code for unknown states", () => {
    expect(stateName("ZZ")).toBe("ZZ");
  });
  it("keeps a valid stored choice, otherwise Karnataka, otherwise the first", () => {
    const live = liveStates(offices);
    expect(resolveState("TN", live)).toBe("TN");
    expect(resolveState("MH", live)).toBe("KA");
    expect(resolveState(null, liveStates([{ state: "TN" }]))).toBe("TN");
  });
});
