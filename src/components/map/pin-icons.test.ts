import { describe, expect, it } from "vitest";
import { clusterProgress } from "@/components/map/pin-icons";

describe("clusterProgress", () => {
  it("reports none, some or all stamped", () => {
    expect(clusterProgress(0, 5)).toBe("none");
    expect(clusterProgress(2, 5)).toBe("some");
    expect(clusterProgress(5, 5)).toBe("all");
  });
});
