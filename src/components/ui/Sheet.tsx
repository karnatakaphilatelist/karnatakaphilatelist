"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseIcon } from "@/components/ui/icons";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Modal dialog that is a bottom sheet on phones and a centred card on larger
 * screens. Built on the native <dialog>, which provides focus trapping and
 * Escape-to-close for free.
 */
export function Sheet({ open, onClose, title, description, children }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Several sheets are in the page at once (sign-in is always mounted), so each
  // needs its own id or every dialog would be named after the first one.
  const titleId = useId();

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
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      aria-labelledby={titleId}
      tabIndex={-1}
      className="outline-none mx-auto mb-0 mt-auto max-h-[92dvh] w-full max-w-none animate-[rise_.25s_ease-out] overflow-y-auto rounded-t-sm bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/50 md:m-auto md:max-w-md md:rounded-sm"
    >
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div>
          <h2
            id={titleId}
            className="font-display text-xl font-bold tracking-tight"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-sm text-muted">{description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-2 -mt-1 grid size-11 shrink-0 place-items-center rounded-full bg-sand text-ink"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>
      <div className="px-5 pb-6 pt-4">{children}</div>
    </dialog>
  );
}
