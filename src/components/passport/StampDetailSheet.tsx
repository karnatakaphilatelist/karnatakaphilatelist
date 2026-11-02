"use client";

import { StampThumb } from "@/components/office/StampThumb";
import { Sheet } from "@/components/ui/Sheet";
import type { PostOffice, Visit } from "@/types";

interface StampDetailSheetProps {
  office: PostOffice | null;
  visit: Visit | undefined;
  onClose: () => void;
}

/** One stamp, large, with when it was collected. */
export function StampDetailSheet({ office, visit, onClose }: StampDetailSheetProps) {
  return (
    <Sheet open={office !== null && visit !== undefined} onClose={onClose} title={office?.name ?? "Stamp"}>
      {office && visit ? (
        <div className="text-center">
          <span className="kp-perf inline-block drop-shadow-md">
            <StampThumb path={office.stampImagePath} status="visited" className="size-40" />
          </span>
          <p className="mt-4 text-base font-semibold">{office.district} district · {office.pincode}</p>
          <p className="mt-1 text-sm text-muted">Collected {visit.visitedAt}</p>
          {visit.note ? <p className="mt-3 whitespace-pre-line text-sm leading-5">{visit.note}</p> : null}
        </div>
      ) : null}
    </Sheet>
  );
}
