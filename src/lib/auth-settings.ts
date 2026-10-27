import { env } from "@/lib/env";

/** Reads whether Google sign-in is switched on from the auth server's settings payload. */
export function parseGoogleEnabled(body: unknown): boolean | null {
  if (typeof body !== "object" || body === null) return null;
  const external = (body as { external?: unknown }).external;
  if (typeof external !== "object" || external === null) return null;
  const google = (external as { google?: unknown }).google;
  return typeof google === "boolean" ? google : null;
}

/**
 * Asks Supabase whether Google sign-in is enabled for this project.
 * Returns null when that cannot be determined (offline, blocked, unexpected reply),
 * in which case the app simply offers Google and lets the sign-in attempt decide.
 */
export async function fetchGoogleEnabled(signal?: AbortSignal): Promise<boolean | null> {
  try {
    const response = await fetch(`${env.supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: env.supabasePublishableKey },
      signal,
    });
    if (!response.ok) return null;
    return parseGoogleEnabled(await response.json());
  } catch {
    return null;
  }
}
