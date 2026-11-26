"use client";

import { useEffect, useState } from "react";
import { loadSupabase } from "@/lib/supabase/lazy";
import {
  fetchPublicVisitsForOffice,
  type PublicVisitNote,
} from "@/lib/visits/remote-store";

/** Public notes for one office. Null while loading, [] once loaded with none. */
export function usePublicNotes(officeId: number): PublicVisitNote[] | null {
  const [state, setState] = useState<{
    officeId: number;
    notes: PublicVisitNote[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadSupabase()
      .then((supabase) => fetchPublicVisitsForOffice(supabase, officeId))
      .then((rows) => {
        if (!cancelled) setState({ officeId, notes: rows });
      })
      .catch(() => {
        if (!cancelled) setState({ officeId, notes: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [officeId]);

  // Stale results from a previous officeId read as "loading" until the new fetch lands.
  return state && state.officeId === officeId ? state.notes : null;
}
