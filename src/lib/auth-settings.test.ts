import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: { supabaseUrl: "https://example.supabase.co", supabasePublishableKey: "pk" },
}));

import { fetchGoogleEnabled, parseGoogleEnabled } from "@/lib/auth-settings";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseGoogleEnabled", () => {
  it("reads the provider flag", () => {
    expect(parseGoogleEnabled({ external: { google: true, email: true } })).toBe(true);
    expect(parseGoogleEnabled({ external: { google: false } })).toBe(false);
  });

  it("returns null for anything unexpected", () => {
    expect(parseGoogleEnabled(null)).toBeNull();
    expect(parseGoogleEnabled({})).toBeNull();
    expect(parseGoogleEnabled({ external: { google: "yes" } })).toBeNull();
    expect(parseGoogleEnabled("nope")).toBeNull();
  });
});

describe("fetchGoogleEnabled", () => {
  it("calls the settings endpoint with the publishable key", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ external: { google: false } }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchGoogleEnabled()).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.supabase.co/auth/v1/settings",
      expect.objectContaining({ headers: { apikey: "pk" } }),
    );
  });

  it("returns null when the request fails or is rejected", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({}) })));
    await expect(fetchGoogleEnabled()).resolves.toBeNull();

    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
    await expect(fetchGoogleEnabled()).resolves.toBeNull();
  });
});
