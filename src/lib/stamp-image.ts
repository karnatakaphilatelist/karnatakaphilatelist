import { env } from "@/lib/env";

export const STAMP_BUCKET = "office-stamps";

/** Public URL of a post office's official stamp image, or null when it has none. */
export function stampImageUrl(path: string | null): string | null {
  if (!path) return null;
  return `${env.supabaseUrl}/storage/v1/object/public/${STAMP_BUCKET}/${encodeURI(path)}`;
}
