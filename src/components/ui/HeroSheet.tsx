"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/** Matches --animate-fall's duration in globals.css. */
const FALL_DURATION_MS = 200;

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
 * Bottom-sheet sign-in dialog: a red hero card + glass form panel, docked to the bottom of the screen
 * so the map is visible above it. On larger screens it is a centred card. Built on the native <dialog>.
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
  // Plays the "fall" exit transition before the native dialog actually closes,
  // matching the rise-in/fall-out convention used by OfficeDetail/ContributeSheet.
  // Derived during render (not an effect) per React's guidance for adjusting
  // state when a prop changes, so the setState call below isn't in an effect body.
  const [closing, setClosing] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    setClosing(!open);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) {
        dialog.showModal();
        dialog.focus({ preventScroll: true });
      }
      return;
    }
    if (dialog.open) {
      const timer = setTimeout(() => dialog.close(), FALL_DURATION_MS);
      return () => clearTimeout(timer);
    }
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
      className={`m-0 mt-auto w-full max-w-none bg-transparent p-0 text-ink outline-none backdrop:bg-ink/40 backdrop:backdrop-blur-sm md:m-auto md:max-w-md md:overflow-hidden md:rounded-3xl md:[background:linear-gradient(180deg,#fffaf0,#f8eed8)] ${
        closing ? "animate-fall" : "animate-[rise_.25s_ease-out]"
      }`}
    >
      <h2 id={labelId} className="sr-only">
        {label}
      </h2>
      <div className="flex flex-col md:h-auto">
        <div
          className={`kp-red relative shrink-0 overflow-hidden rounded-t-[28px] px-4 pt-6 text-white transition-[height] duration-300 md:rounded-t-3xl md:pt-8 ${
            compact ? "h-[200px]" : "h-[min(44dvh,360px)] md:h-[300px]"
          }`}
        >
          {hero}
        </div>
        <div className="[background:linear-gradient(180deg,#fffaf0,#f8eed8)] max-h-[60dvh] overflow-y-auto rounded-b-none px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-6 md:rounded-b-3xl">
          {children}
        </div>
      </div>
    </dialog>
  );
}
