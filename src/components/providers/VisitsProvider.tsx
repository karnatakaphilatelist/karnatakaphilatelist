"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { GUEST_VISITS_KEY, PLANNED_KEY } from "@/lib/constants";
import { compressImage } from "@/lib/image";
import { readJson, removeKey, writeJson } from "@/lib/local-storage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  deleteVisit,
  fetchVisits,
  removeStampPhoto,
  saveVisit,
  saveVisits,
  uploadStampPhoto,
} from "@/lib/visits/remote-store";
import type { Visit } from "@/types";

type VisitMap = Record<number, Visit>;

export interface VisitDetails {
  note: string;
  isPublic: boolean;
  /** A newly chosen photo to upload (signed-in users only). */
  newPhoto: File | null;
  removePhoto: boolean;
}

interface VisitsContextValue {
  /** The current user's visits keyed by post office id. */
  visits: VisitMap;
  plannedIds: ReadonlySet<number>;
  /** False until the first load for the current user (or guest) has finished. */
  isReady: boolean;
  markVisited: (officeId: number) => Promise<boolean>;
  saveDetails: (officeId: number, details: VisitDetails) => Promise<boolean>;
  removeVisit: (officeId: number) => Promise<boolean>;
  togglePlanned: (officeId: number) => void;
}

const VisitsContext = createContext<VisitsContextValue | null>(null);

const indexByOffice = (visits: Visit[]): VisitMap =>
  Object.fromEntries(visits.map((visit) => [visit.officeId, visit]));

/** Today's date as YYYY-MM-DD in the user's local time zone. */
const todayIso = () => new Date().toLocaleDateString("en-CA");

export function VisitsProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [visits, setVisits] = useState<VisitMap>({});
  const [plannedIds, setPlannedIds] = useState<ReadonlySet<number>>(new Set());
  const [isReady, setIsReady] = useState(false);

  // Mirror of `visits` so actions always read the latest value, even between renders.
  const visitsRef = useRef<VisitMap>({});

  const userId = user?.id ?? null;

  const commit = useCallback(
    (next: VisitMap) => {
      visitsRef.current = next;
      setVisits(next);
      if (!userId) writeJson(GUEST_VISITS_KEY, Object.values(next));
    },
    [userId],
  );

  const reportError = useCallback(
    (action: string, error: unknown) => {
      const detail = error instanceof Error ? error.message : "Unknown error";
      showToast({ message: `Could not ${action}. ${detail}` });
    },
    [showToast],
  );

  // Planned offices are a personal to-do list, kept on this device only.
  useEffect(() => {
    setPlannedIds(new Set(readJson<number[]>(PLANNED_KEY, [])));
  }, []);

  // Load visits for the current user, or for the guest when signed out.
  // Guest visits are merged into the account the first time someone signs in.
  useEffect(() => {
    if (isAuthLoading) return;
    let cancelled = false;

    async function load() {
      const guestVisits = readJson<Visit[]>(GUEST_VISITS_KEY, []);
      try {
        let loaded = guestVisits;
        if (userId) {
          if (guestVisits.length > 0) {
            await saveVisits(supabase, userId, guestVisits);
            removeKey(GUEST_VISITS_KEY);
          }
          loaded = await fetchVisits(supabase, userId);
        }
        if (cancelled) return;
        visitsRef.current = indexByOffice(loaded);
        setVisits(visitsRef.current);
      } catch (error) {
        if (!cancelled) reportError("load your passport", error);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, userId, supabase, reportError]);

  const markVisited = useCallback(
    async (officeId: number) => {
      const previous = visitsRef.current;
      const visit: Visit = {
        officeId,
        visitedAt: todayIso(),
        note: "",
        photoPath: null,
        isPublic: false,
      };
      commit({ ...previous, [officeId]: visit });
      if (!userId) return true;
      try {
        await saveVisit(supabase, userId, visit);
        return true;
      } catch (error) {
        commit(previous);
        reportError("save your visit", error);
        return false;
      }
    },
    [commit, userId, supabase, reportError],
  );

  const saveDetails = useCallback(
    async (officeId: number, details: VisitDetails) => {
      const current = visitsRef.current[officeId];
      if (!current) return false;

      try {
        let photoPath = details.removePhoto ? null : current.photoPath;
        if (userId && details.newPhoto) {
          const compressed = await compressImage(details.newPhoto);
          photoPath = await uploadStampPhoto(supabase, userId, officeId, compressed);
        }

        const updated: Visit = {
          ...current,
          note: details.note.trim(),
          isPublic: details.isPublic,
          photoPath,
        };
        if (userId) await saveVisit(supabase, userId, updated);
        commit({ ...visitsRef.current, [officeId]: updated });

        // Clean up the replaced photo only after the new state is safely saved.
        if (userId && current.photoPath && current.photoPath !== photoPath) {
          removeStampPhoto(supabase, current.photoPath).catch(() => undefined);
        }
        return true;
      } catch (error) {
        reportError("save your changes", error);
        return false;
      }
    },
    [commit, userId, supabase, reportError],
  );

  const removeVisit = useCallback(
    async (officeId: number) => {
      const previous = visitsRef.current;
      const existing = previous[officeId];
      if (!existing) return true;

      const { [officeId]: removed, ...rest } = previous;
      void removed;
      commit(rest);
      if (!userId) return true;
      try {
        await deleteVisit(supabase, userId, officeId);
        if (existing.photoPath) {
          removeStampPhoto(supabase, existing.photoPath).catch(() => undefined);
        }
        return true;
      } catch (error) {
        commit(previous);
        reportError("remove your visit", error);
        return false;
      }
    },
    [commit, userId, supabase, reportError],
  );

  const togglePlanned = useCallback((officeId: number) => {
    setPlannedIds((previous) => {
      const next = new Set(previous);
      if (!next.delete(officeId)) next.add(officeId);
      writeJson(PLANNED_KEY, [...next]);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      visits,
      plannedIds,
      isReady,
      markVisited,
      saveDetails,
      removeVisit,
      togglePlanned,
    }),
    [visits, plannedIds, isReady, markVisited, saveDetails, removeVisit, togglePlanned],
  );

  return <VisitsContext.Provider value={value}>{children}</VisitsContext.Provider>;
}

export function useVisits(): VisitsContextValue {
  const context = useContext(VisitsContext);
  if (!context) throw new Error("useVisits must be used inside <VisitsProvider>");
  return context;
}
