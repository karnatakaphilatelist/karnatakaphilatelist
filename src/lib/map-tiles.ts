/**
 * Map tile layer configuration.
 *
 * Uses MapTiler when NEXT_PUBLIC_MAPTILER_KEY is set (recommended — fast CDN,
 * no rate limits on a reasonable free tier), otherwise falls back to the free
 * OpenStreetMap tile servers (not suitable for production: rate-limited, no SLA).
 *
 * To set up MapTiler:
 * 1. Create a free account at https://cloud.maptiler.com
 * 2. Copy your API key from Account → Keys
 * 3. Add NEXT_PUBLIC_MAPTILER_KEY=<your-key> to Vercel environment variables
 *    and to .env.local for local development
 */
import { env } from "@/lib/env";

export interface TileConfig {
  url: string;
  attribution: string;
  maxZoom: number;
  tileSize?: number;
  zoomOffset?: number;
}

/** MapTiler's "Dataviz" style: clean, detail-rich, same OSM data, CDN-backed. */
function maptilerConfig(key: string): TileConfig {
  return {
    url: `https://api.maptiler.com/maps/dataviz/{z}/{x}/{y}.png?key=${key}`,
    attribution:
      '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 20,
  };
}

/** Free OpenStreetMap tile server — fallback only. Rate-limited, no SLA. */
const osmConfig: TileConfig = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
};

/** Returns the best available tile configuration for the current environment. */
export function getTileConfig(): TileConfig {
  if (env.maptilerKey) return maptilerConfig(env.maptilerKey);
  return osmConfig;
}
