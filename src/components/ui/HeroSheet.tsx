"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

interface HeroSheetProps {
  open: boolean;
  onClose: () => void;
  /** Screen-reader name of the dialog. */
  label: string;
  /** Content of the red hero (masthead, headline, tagline). */
  hero: ReactNode;
  /** Short hero, used for the form step. */
  compact?: boolean;
  children: ReactNode;
}

/**
 * Full-height dialog of direction D's sign-in: a red hero on top, the map showing through a gap, and a glass
 * panel docked at the bottom. On larger screens it is a centred card. Built on the native <dialog>.
 */
export function HeroSheet({
  open,
  onClose,
  label,
  hero,
  compact = false,
  children,
}: HeroSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const labelId = useId();
  const pressStartedOnBackdrop = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.focus({ preventScroll: true });
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onPointerDown={(event) => {
        pressStartedOnBackdrop.current = event.target === dialogRef.current;
      }}
      onClick={(event) => {
        const fromBackdrop =
          event.target === dialogRef.current && pressStartedOnBackdrop.current;
        pressStartedOnBackdrop.current = false;
        if (fromBackdrop) onClose();
      }}
      onCancel={(event) => {
        // The Back gesture that hides the keyboard should only hide the keyboard, not the whole dialog.
        const active = document.activeElement;
        if (
          active instanceof HTMLElement &&
          dialogRef.current?.contains(active) &&
          active.matches("input, textarea, select")
        ) {
          event.preventDefault();
          active.blur();
        }
      }}
      aria-labelledby={labelId}
      tabIndex={-1}
      className="m-0 h-dvh max-h-none w-full max-w-none [background:linear-gradient(180deg,#fffaf0,#f8eed8)] p-0 text-ink outline-none backdrop:bg-[#3a2a0c]/40 md:m-auto md:h-auto md:max-h-[92dvh] md:max-w-md md:overflow-hidden md:rounded-3xl"
    >
      <h2 id={labelId} className="sr-only">
        {label}
      </h2>
      <div className="flex h-full flex-col md:h-auto">
        <div
          className={`kp-red relative shrink-0 overflow-hidden rounded-b-[28px] px-4 pt-[calc(2.75rem+env(safe-area-inset-top))] text-white transition-[height] duration-300 md:pt-8 ${
            compact ? "h-[232px]" : "h-[min(56dvh,470px)] md:h-[340px]"
          }`}
        >
          {hero}
        </div>
        <div className="kp-glass-panel [background:linear-gradient(180deg,#fffaf0,#f8eed8)] mt-auto max-h-[80dvh] overflow-y-auto rounded-t-[28px] px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 md:mt-0 md:rounded-t-none md:rounded-b-3xl">
          {children}
        </div>
      </div>
    </dialog>
  );
}
