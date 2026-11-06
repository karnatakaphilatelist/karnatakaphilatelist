"use client";

import { Sheet } from "@/components/ui/Sheet";
import { AlertIcon, TargetIcon } from "@/components/ui/icons";

interface LocationSheetProps {
  /** `prime` explains the request before the system prompt; `denied` explains how to turn it back on. */
  mode: "prime" | "denied" | null;
  /** True inside the phone app, where the setting lives in the phone's Settings. */
  native: boolean;
  onContinue: () => void;
  onClose: () => void;
}

/** Plain-words sheets around the location permission, so the system prompt is never a surprise. */
export function LocationSheet({
  mode,
  native,
  onContinue,
  onClose,
}: LocationSheetProps) {
  return (
    <Sheet
      open={mode !== null}
      onClose={onClose}
      title={
        mode === "denied" ? "Location is off" : "Find post offices near you"
      }
    >
      {mode === "prime" ? (
        <>
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sand">
              <TargetIcon className="size-6" />
            </span>
            <p className="text-base leading-6 text-muted">
              We use your location only to sort post offices by distance and to
              show how far you are from one. It is not stored or shared.
            </p>
          </div>
          <button
            type="button"
            onClick={onContinue}
            className="mt-6 min-h-13 w-full rounded-full bg-postal text-base font-bold text-white"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 min-h-12 w-full rounded-full text-base font-semibold text-ink"
          >
            Not now
          </button>
        </>
      ) : null}
      {mode === "denied" ? (
        <>
          <div className="flex items-start gap-3 rounded-2xl bg-warn-soft p-4 text-warn">
            <AlertIcon className="mt-0.5 size-5 shrink-0" />
            <p className="text-sm leading-5">
              {native
                ? "To see what is near you, open your phone's Settings, choose this app, then turn Location on."
                : "To see what is near you, allow location for this site in your browser settings."}{" "}
              You can still browse and search every post office.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 min-h-13 w-full rounded-full bg-ink text-base font-bold text-white"
          >
            OK
          </button>
        </>
      ) : null}
    </Sheet>
  );
}
