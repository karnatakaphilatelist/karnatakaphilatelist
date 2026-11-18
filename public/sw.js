/**
 * Philatrail service worker — offline support for the native apps.
 *
 * Strategy:
 * - App shell (HTML, JS, CSS, fonts): Cache-First with network revalidation.
 * - Office data (the /api/ and RSC payloads): Network-First, fall back to cache.
 * - Map tiles: Cache-First, up to 500 tiles (≈ 2–3 MB for India at zoom 10–14).
 * - Everything else: Network-First.
 *
 * The SW is only registered when running inside the native app (PhilatrailApp UA).
 * On the web, it stays dormant so normal browser caching handles things.
 */

const CACHE_VERSION = "v1";
const SHELL_CACHE = `shell-${CACHE_VERSION}`;
const DATA_CACHE = `data-${CACHE_VERSION}`;
const TILE_CACHE = `tiles-${CACHE_VERSION}`;
const MAX_TILE_ENTRIES = 500;

/** Pages to pre-cache on install so the app opens instantly offline. */
const SHELL_URLS = [
  "/explore",
  "/passport",
  "/learn",
  "/offline",
];

// ── Install ──────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        cache.addAll(SHELL_URLS).catch(() => {
          // Silently ignore pre-cache failures — the app still works online.
        })
      )
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) =>
                k !== SHELL_CACHE && k !== DATA_CACHE && k !== TILE_CACHE
            )
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin (except tiles), and chrome-extension requests.
  if (request.method !== "GET") return;
  if (
    url.origin !== self.location.origin &&
    !url.hostname.includes("maptiler.com") &&
    !url.hostname.includes("tile.openstreetmap.org")
  ) {
    return;
  }

  // Map tiles — Cache-First, capped at MAX_TILE_ENTRIES.
  if (
    url.hostname.includes("maptiler.com") ||
    url.hostname.includes("tile.openstreetmap.org")
  ) {
    event.respondWith(cacheFirstTile(request));
    return;
  }

  // Static assets (_next/static) — Cache-First (hashed filenames, safe forever).
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  // Office data RSC / API requests — Network-First, fall back to cache.
  if (
    url.pathname.startsWith("/_next/data/") ||
    url.pathname.startsWith("/api/") ||
    url.search.includes("_rsc=")
  ) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }

  // Everything else (HTML pages) — Network-First, fall back to cache.
  event.respondWith(networkFirst(request, SHELL_CACHE));
});

// ── Strategies ───────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    // Revalidate in the background.
    fetch(request)
      .then((res) => {
        if (res.ok) cache.put(request, res);
      })
      .catch(() => undefined);
    return cached;
  }
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached ?? Response.error();
  }
}

async function cacheFirstTile(request) {
  const cache = await caches.open(TILE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Evict oldest tiles if we've hit the cap.
      const keys = await cache.keys();
      if (keys.length >= MAX_TILE_ENTRIES) {
        await cache.delete(keys[0]);
      }
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return Response.error();
  }
}
