import { describe, expect, it } from "vitest";
import { clusterPoints, CLUSTER_MAX_ZOOM } from "@/lib/cluster";

const near = [
  { id: 1, lat: 12.97, lng: 77.59 },
  { id: 2, lat: 12.971, lng: 77.591 },
  { id: 3, lat: 12.972, lng: 77.592 },
];
const far = { id: 4, lat: 15.35, lng: 75.12 };

describe("clusterPoints", () => {
  it("merges close points and keeps far ones separate when zoomed out", () => {
    const clusters = clusterPoints([...near, far], 7);
    expect(clusters).toHaveLength(2);
    expect(clusters.find((c) => c.ids.length === 3)?.ids).toEqual([1, 2, 3]);
  });

  it("shows every point on its own when zoomed in", () => {
    expect(clusterPoints([...near, far], CLUSTER_MAX_ZOOM)).toHaveLength(4);
  });

  it("splits clusters as the map zooms in", () => {
    const zoomedOut = clusterPoints(near, 6).length;
    const zoomedIn = clusterPoints(near, 11).length;
    expect(zoomedIn).toBeGreaterThanOrEqual(zoomedOut);
  });

  it("never merges points that must stay single", () => {
    const clusters = clusterPoints(near, 7, 52, new Set([2]));
    expect(clusters.some((c) => c.ids.length === 1 && c.ids[0] === 2)).toBe(
      true,
    );
    expect(clusters.flatMap((c) => c.ids).sort()).toEqual([1, 2, 3]);
  });

  it("places a cluster at the average of its members", () => {
    const [cluster] = clusterPoints(near, 5);
    expect(cluster.lat).toBeCloseTo(12.971, 3);
    expect(cluster.lng).toBeCloseTo(77.591, 3);
  });
});
