"use client";

import { useEffect, useState } from "react";
import { loadSupabase } from "@/lib/supabase/lazy";
import { PHOTO_BUCKET } from "@/lib/visits/remote-store";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * Resolves a private stamp photo path to a short-lived signed URL.
 * Returns null while loading, when there is no photo, or if the lookup fails.
 */
export function usePhotoUrl(path: string | null): string | null {
  const [signed, setSigned] = useState<{ path: string; url: string } | null>(
    null
  );

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    loadSupabase()
      .then((supabase) =>
        supabase.storage
          .from(PHOTO_BUCKET)
          .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
      )
      .then(({ data }) => {
        if (!cancelled && data) setSigned({ path, url: data.signedUrl });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [path]);

  return signed && signed.path === path ? signed.url : null;
}
