import L from "leaflet";
import type { OfficeStatus } from "@/types";

// Each status has a different glyph so pins stay distinguishable without colour.
const GLYPHS: Record<OfficeStatus, string> = {
  unvisited:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  planned:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></svg>',
  visited:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
};

const cache = new Map<string, L.DivIcon>();

/** Returns a (cached) Leaflet icon for a status; styles live in globals.css. */
export function getPinIcon(status: OfficeStatus, selected: boolean): L.DivIcon {
  const key = `${status}:${selected}`;
  let icon = cache.get(key);
  if (!icon) {
    icon = L.divIcon({
      className: "kp-marker",
      html: `<span class="kp-pin kp-pin--${status}${selected ? " kp-pin--selected" : ""}">${GLYPHS[status]}</span>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
    cache.set(key, icon);
  }
  return icon;
}

const clusterCache = new Map<number, L.DivIcon>();

/** Returns a (cached) bubble icon showing how many post offices it stands for. */
export function getClusterIcon(count: number): L.DivIcon {
  let icon = clusterCache.get(count);
  if (!icon) {
    const size = count >= 20 ? 48 : count >= 8 ? 42 : 36;
    icon = L.divIcon({
      className: "kp-marker",
      html: `<span class="kp-cluster" style="width:${size}px;height:${size}px">${count}</span>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
    clusterCache.set(count, icon);
  }
  return icon;
}
