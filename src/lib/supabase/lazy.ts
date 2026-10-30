import type { SupabaseClient } from "@supabase/supabase-js";

let pending: Promise<SupabaseClient> | undefined;

/**
 * Loads the Supabase browser client on demand. The library is the largest script on the page,
 * and guests who never sign in do not need it, so it stays out of the first load.
 */
export function loadSupabase(): Promise<SupabaseClient> {
  pending ??= import("./client")
    .then((module) => module.getSupabaseBrowserClient())
    .catch((error) => {
      pending = undefined;
      throw error;
    });
  return pending;
}

/** True when a Supabase session (or a sign-in in progress) has left its cookie in this browser. */
export function hasStoredSession(): boolean {
  try {
    return /(?:^|;\s*)sb-[^=;]*-auth-token/.test(document.cookie);
  } catch {
    // If cookies cannot be read, play safe and look for a session.
    return true;
  }
}
