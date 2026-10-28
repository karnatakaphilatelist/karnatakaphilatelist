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
import { todayIso } from "@/lib/date";
import { compressImage } from "@/lib/image";
import { readJson, removeKey, writeJson } from "@/lib/local-storage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { parseGuestVisits, parsePlannedIds } from "@/lib/visits/guest-visits";
import {
  deleteVisit,
  fetchVisits,
  insertVisitIfMissing,
  mergeGuestVisits,
  removeStampPhoto,
  updateVisitDetails,
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
  /** The current user's visits keyed by post office id. Empty until `isReady`. */
  visits: VisitMap;
  plannedIds: ReadonlySet<number>;
  /**
   * False until the visits for the person currently using the app (the signed-in
   * user, or the guest) have been loaded. It goes back to false when someone
   * signs in or out, so one person's stamps are never shown as another's.
   */
  isReady: boolean;
  markVisited: (officeId: number) => Promise<boolean>;
  saveDetails: (officeId: number, details: VisitDetails) => Promise<boolean>;
  removeVisit: (officeId: number) => Promise<boolean>;
  togglePlanned: (officeId: number) => void;
}

const VisitsContext = createContext<VisitsContextValue | null>(null);

/** Identifies the guest. It can never equal a user id, which is always a UUID. */
const GUEST_OWNER = "guest";
const EMPTY_VISITS: VisitMap = Object.freeze({}) as VisitMap;

const indexByOffice = (visits: Visit[]): VisitMap =>
  Object.fromEntries(visits.map((visit) => [visit.officeId, visit]));

function withoutOffice(visits: VisitMap, officeId: number): VisitMap {
  const next = { ...visits };
  delete next[officeId];
  return next;
}

export function VisitsProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [visits, setVisits] = useState<VisitMap>({});
  /** Whose visits `visits` currently holds: a user id, GUEST_OWNER, or null before the first load. */
  const [ownerKey, setOwnerKey] = useState<string | null>(null);
  const [plannedIds, setPlannedIds] = useState<ReadonlySet<number>>(new Set());

  // Mirrors of the state so actions always read the latest value, even between renders.
  const visitsRef = useRef<VisitMap>({});
  const ownerRef = useRef<string | null>(null);

  const userId = user?.id ?? null;
  const identityKey = userId ?? GUEST_OWNER;
  const isReady = !isAuthLoading && ownerKey === identityKey;

  const commit = useCallback(
    (next: VisitMap) => {
      visitsRef.current = next;
      setVisits(next);
      if (!userId) writeJson(GUEST_VISITS_KEY, Object.values(next));
    },
    [userId]
  );

  const reportError = useCallback(
    (action: string, error: unknown) => {
      const detail = error instanceof Error ? error.message : "Unknown error";
      showToast({ message: `Could not ${action}. ${detail}` });
    },
    [showToast]
  );

  /** True when the loaded visits belong to the person using the app right now. */
  const isLoadedForCurrentPerson = useCallback(() => {
    if (ownerRef.current === identityKey) return true;
    showToast({
      message: "Your passport is still loading. Try again in a moment.",
    });
    return false;
  }, [identityKey, showToast]);

  // Planned offices are a personal to-do list, kept on this device only.
  useEffect(() => {
    const stored = parsePlannedIds(readJson<unknown>(PLANNED_KEY, []));
    // Reading localStorage can only happen after hydration, so this one-time sync is intended.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlannedIds(new Set(stored));
  }, []);

  // Load visits for the current user, or for the guest when signed out.
  // Guest visits are merged into the account the first time someone signs in.
  useEffect(() => {
    if (isAuthLoading) return;
    let cancelled = false;

    async function load() {
      const guestVisits = parseGuestVisits(
        readJson<unknown>(GUEST_VISITS_KEY, [])
      );
      let loaded = guestVisits;
      let mergeError: unknown = null;
      let loadError: unknown = null;

      if (userId) {
        if (guestVisits.length > 0) {
          try {
            await mergeGuestVisits(supabase, userId, guestVisits);
            removeKey(GUEST_VISITS_KEY);
          } catch (error) {
            // Keep the stamps on this device so the next sign-in can try again,
            // and still show the account's own passport below.
            mergeError = error;
          }
        }
        try {
          loaded = await fetchVisits(supabase, userId);
        } catch (error) {
          loaded = [];
          loadError = error;
        }
      }
      if (cancelled) return;

      visitsRef.current = indexByOffice(loaded);
      ownerRef.current = identityKey;
      setVisits(visitsRef.current);
      setOwnerKey(identityKey);

      if (loadError) reportError("load your passport", loadError);
      else if (mergeError)
        reportError("move your guest stamps to your account", mergeError);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, userId, identityKey, supabase, reportError]);

  const markVisited = useCallback(
    async (officeId: number) => {
      if (!isLoadedForCurrentPerson()) return false;
      const previous = visitsRef.current;
      // Already stamped: never replace the existing note and photo with a blank visit.
      if (previous[officeId]) return true;

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
        await insertVisitIfMissing(supabase, userId, visit);
        return true;
      } catch (error) {
        commit(withoutOffice(visitsRef.current, officeId));
        reportError("save your visit", error);
        return false;
      }
    },
    [commit, userId, supabase, reportError, isLoadedForCurrentPerson]
  );

  const saveDetails = useCallback(
    async (officeId: number, details: VisitDetails) => {
      if (!isLoadedForCurrentPerson()) return false;
      const current = visitsRef.current[officeId];
      if (!current) return false;

      let uploadedPath: string | null = null;
      const discardUpload = () => {
        if (uploadedPath)
          removeStampPhoto(supabase, uploadedPath).catch(() => undefined);
      };

      try {
        let photoPath = details.removePhoto ? null : current.photoPath;
        if (userId && details.newPhoto) {
          const compressed = await compressImage(details.newPhoto);
          uploadedPath = await uploadStampPhoto(
            supabase,
            userId,
            officeId,
            compressed
          );
          photoPath = uploadedPath;
        }

        const updated: Visit = {
          ...current,
          note: details.note.trim(),
          isPublic: details.isPublic,
          photoPath,
        };
        if (userId) await updateVisitDetails(supabase, userId, updated);

        // The visit was removed while this was saving: do not bring it back.
        if (!visitsRef.current[officeId]) {
          discardUpload();
          return false;
        }
        commit({ ...visitsRef.current, [officeId]: updated });

        // Clean up the replaced photo only after the new state is safely saved.
        if (userId && current.photoPath && current.photoPath !== photoPath) {
          removeStampPhoto(supabase, current.photoPath).catch(() => undefined);
        }
        return true;
      } catch (error) {
        // Do not leave an uploaded photo behind when the save itself failed.
        discardUpload();
        reportError("save your changes", error);
        return false;
      }
    },
    [commit, userId, supabase, reportError, isLoadedForCurrentPerson]
  );

  const removeVisit = useCallback(
    async (officeId: number) => {
      if (!isLoadedForCurrentPerson()) return false;
      const existing = visitsRef.current[officeId];
      if (!existing) return true;

      commit(withoutOffice(visitsRef.current, officeId));
      if (!userId) return true;
      try {
        await deleteVisit(supabase, userId, officeId);
        if (existing.photoPath) {
          removeStampPhoto(supabase, existing.photoPath).catch(() => undefined);
        }
        return true;
      } catch (error) {
        commit({ ...visitsRef.current, [officeId]: existing });
        reportError("remove your visit", error);
        return false;
      }
    },
    [commit, userId, supabase, reportError, isLoadedForCurrentPerson]
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
      visits: isReady ? visits : EMPTY_VISITS,
      plannedIds,
      isReady,
      markVisited,
      saveDetails,
      removeVisit,
      togglePlanned,
    }),
    [
      visits,
      plannedIds,
      isReady,
      markVisited,
      saveDetails,
      removeVisit,
      togglePlanned,
    ]
  );

  return (
    <VisitsContext.Provider value={value}>{children}</VisitsContext.Provider>
  );
}

export function useVisits(): VisitsContextValue {
  const context = useContext(VisitsContext);
  if (!context)
    throw new Error("useVisits must be used inside <VisitsProvider>");
  return context;
}
