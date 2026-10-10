import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let browserClient: SupabaseClient | undefined;

/** Supabase client for Client Components. One shared instance per browser tab. */
export function getSupabaseBrowserClient(): SupabaseClient {
  browserClient ??= createBrowserClient(
    env.supabaseUrl,
    env.supabasePublishableKey,
  );
  return browserClient;
}
