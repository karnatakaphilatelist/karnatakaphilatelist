"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface OverlayContextValue {
  /** True while a full-bleed sheet (e.g. the office detail card) is open over the tab bar. */
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

/**
 * Tracks whether a phone-only bottom sheet is currently open, so the tab bar
 * (rendered higher up, in `AppShell`) can hide itself instead of peeking out
 * from under the sheet.
 */
export function OverlayProvider({ children }: { children: ReactNode }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const value = useMemo(() => ({ sheetOpen, setSheetOpen }), [sheetOpen]);
  return (
    <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>
  );
}

export function useOverlay(): OverlayContextValue {
  const context = useContext(OverlayContext);
  if (!context)
    throw new Error("useOverlay must be used inside <OverlayProvider>");
  return context;
}
