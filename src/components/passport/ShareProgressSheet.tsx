"use client";

import { Sheet } from "@/components/ui/Sheet";

interface ShareProgressSheetProps {
  open: boolean;
  stamped: number;
  total: number;
  stateName: string;
  onShare: () => void;
  onClose: () => void;
}

/** A preview of the card being shared, so people see what they are sending. */
export function ShareProgressSheet({ open, stamped, total, stateName, onShare, onClose }: ShareProgressSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Share your progress">
      <div className="kp-red rounded-2xl p-5 text-center text-white">
        <p className="text-sm font-semibold uppercase tracking-wide text-white/90">My post office passport</p>
        <p className="mt-2 font-display text-6xl font-semibold italic leading-none">{stamped}</p>
        <p className="mt-1 text-base font-semibold">of {total} stamped in {stateName}</p>
      </div>
      <button
        type="button"
        onClick={onShare}
        className="mt-5 min-h-13 w-full rounded-full bg-postal text-base font-bold text-white"
      >
        Share
      </button>
    </Sheet>
  );
}
