import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Cookie-free Supabase client for public reads (for example the post office
 * list). It never touches the user session, so its results are safe to cache.
 */
export function createSupabasePublicClient() {
  return createClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
