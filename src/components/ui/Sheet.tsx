"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseIcon } from "@/components/ui/icons";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Brand-red header band (used by the sign-in sheet). */
  band?: boolean;
  children: ReactNode;
}

/**
 * Modal dialog that is a bottom sheet on phones and a centred card on larger
 * screens. Built on the native <dialog>, which provides focus trapping and
 * Escape-to-close for free.
 */
export function Sheet({ open, onClose, title, description, band = false, children }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Several sheets are in the page at once (sign-in is always mounted), so each
  // needs its own id or every dialog would be named after the first one.
  const titleId = useId();
  // Closing by tapping the dark backdrop only counts when the press began there too. When the keyboard
  // opens the sheet moves, and a tap on a field can otherwise land on the backdrop and close the sheet.
  const pressStartedOnBackdrop = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Start on the dialog itself, not its close button, so no focus ring flashes on an icon.
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
        // The Back gesture that hides the keyboard should only hide the keyboard, not the whole sheet.
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
      aria-labelledby={titleId}
      tabIndex={-1}
      className="outline-none mx-auto mb-0 mt-auto max-h-[92dvh] w-full max-w-none animate-[rise_.25s_ease-out] overflow-y-auto kp-glass-panel rounded-t-3xl p-0 text-ink backdrop:bg-ink/45 md:m-auto md:max-w-md md:rounded-3xl"
    >
      <div className={`flex items-start justify-between gap-3 px-5 pt-5 ${band ? "kp-red pb-5 text-white" : ""}`}>
        <div>
          <h2
            id={titleId}
            className="text-2xl font-medium uppercase leading-7 tracking-[0.01em]"
          >
            {title}
          </h2>
          {description ? (
            <p className={`mt-1 text-sm ${band ? "text-white/90" : "text-muted"}`}>{description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="kp-glass -mr-2 -mt-1 grid size-11 shrink-0 place-items-center rounded-full text-ink"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>
      <div className="px-5 pb-6 pt-4">{children}</div>
    </dialog>
  );
}
