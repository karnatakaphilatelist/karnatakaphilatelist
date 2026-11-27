import { describe, expect, it } from "vitest";
import { PASSPORT_STATES, passportStateFor } from "@/lib/passport-states";

describe("passport states", () => {
  it("finds a state by its code", () => {
    expect(passportStateFor("TN")?.circle).toBe("Tamil Nadu Postal Circle");
    expect(passportStateFor("XX")).toBeUndefined();
  });

  it("keeps each state's pages under its own Philately Passport address", () => {
    for (const state of PASSPORT_STATES) {
      expect(state.path).toBe(`/${state.slug}-philately-passport`);
      expect(state.officesPath).toBe(`${state.path}/post-offices`);
    }
  });
});
