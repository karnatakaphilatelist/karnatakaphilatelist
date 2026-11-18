function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`
    );
  }
  return value;
}

// NEXT_PUBLIC_ variables must be read as static property accesses so Next.js can inline them.
export const env = {
  supabaseUrl: requireEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL
  ),
  supabasePublishableKey: requireEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ),
  /**
   * MapTiler API key — used for the map tile layer.
   * Get one free at https://cloud.maptiler.com/account/keys/
   * Set NEXT_PUBLIC_MAPTILER_KEY in Vercel environment variables.
   * Optional: falls back to OpenStreetMap tile server if not set (not recommended for production).
   */
  maptilerKey: process.env.NEXT_PUBLIC_MAPTILER_KEY ?? "",
} as const;
