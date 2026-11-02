"use client";

import { StampThumb } from "@/components/office/StampThumb";
import { Sheet } from "@/components/ui/Sheet";
import { CheckIcon } from "@/components/ui/icons";
import type { OfficeWithStatus } from "@/types";

interface StampedSheetProps {
  office: OfficeWithStatus | null;
  /** Stamps collected in the current state, including this one. */
  collected: number;
  /** Post offices in the current state. */
  total: number;
  onClose: () => void;
  onAddNote: (officeId: number) => void;
}

/** The moment of reward after "Stamp it": the stamp presses into the passport. */
export function StampedSheet({ office, collected, total, onClose, onAddNote }: StampedSheetProps) {
  return (
    <Sheet open={office !== null} onClose={onClose} title="Stamped!">
      {office ? (
        <div className="text-center">
          <div className="relative mx-auto grid h-32 w-32 place-items-center">
            <span
              aria-hidden="true"
              className="absolute inset-0 animate-[kp-ripple_1.1s_ease-out_0.2s_both] rounded-full border-2 border-visited"
            />
            <span className="animate-[kp-press_1.1s_ease-out_0.2s_both]">
              <StampThumb path={office.stampImagePath} status="visited" className="size-28" />
            </span>
            <span
              aria-hidden="true"
              className="absolute -bottom-1 -right-1 grid size-9 place-items-center rounded-full bg-visited text-white outline-2 outline-offset-1 outline-white"
            >
              <CheckIcon className="size-5" strokeWidth={3} />
            </span>
          </div>
          <p className="mt-4 font-display text-xl font-bold">{office.name}</p>
          <p className="mt-1 text-sm text-muted">
            {collected} of {total} in your passport
          </p>
          <button
            type="button"
            onClick={() => {
              const id = office.id;
              onClose();
              onAddNote(id);
            }}
            className="mt-6 min-h-13 w-full rounded-full bg-ink text-base font-bold text-white"
          >
            Add note and photo
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 min-h-12 w-full rounded-full text-base font-semibold text-ink"
          >
            Done
          </button>
        </div>
      ) : null}
    </Sheet>
  );
}
