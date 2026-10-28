export interface ClusterInput {
  id: number;
  lat: number;
  lng: number;
}

export interface Cluster {
  /** Stable key: the lowest member id. */
  key: number;
  lat: number;
  lng: number;
  ids: number[];
}

/** Zoom level from which every pin is shown on its own. */
export const CLUSTER_MAX_ZOOM = 12;

/** Web Mercator position in pixels at a zoom level (256px tiles). */
function project(
  lat: number,
  lng: number,
  zoom: number,
): { x: number; y: number } {
  const scale = 256 * 2 ** zoom;
  const sin = Math.sin(
    (Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI) / 180,
  );
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

/**
 * Groups points that would sit within `cellPx` screen pixels of each other at this zoom.
 * Points listed in `keepSingle` (for example the selected office) are never merged.
 * Uses a simple grid, so results are stable while panning.
 */
export function clusterPoints(
  points: ClusterInput[],
  zoom: number,
  cellPx = 52,
  keepSingle: ReadonlySet<number> = new Set(),
): Cluster[] {
  if (zoom >= CLUSTER_MAX_ZOOM) {
    return points.map((p) => ({
      key: p.id,
      lat: p.lat,
      lng: p.lng,
      ids: [p.id],
    }));
  }
  const cells = new Map<string, ClusterInput[]>();
  const result: Cluster[] = [];
  for (const point of points) {
    if (keepSingle.has(point.id)) {
      result.push({
        key: point.id,
        lat: point.lat,
        lng: point.lng,
        ids: [point.id],
      });
      continue;
    }
    const { x, y } = project(point.lat, point.lng, zoom);
    const cell = `${Math.floor(x / cellPx)}:${Math.floor(y / cellPx)}`;
    const bucket = cells.get(cell);
    if (bucket) bucket.push(point);
    else cells.set(cell, [point]);
  }
  for (const bucket of cells.values()) {
    const lat = bucket.reduce((sum, p) => sum + p.lat, 0) / bucket.length;
    const lng = bucket.reduce((sum, p) => sum + p.lng, 0) / bucket.length;
    const ids = bucket.map((p) => p.id).sort((a, b) => a - b);
    result.push({ key: ids[0], lat, lng, ids });
  }
  return result;
}
