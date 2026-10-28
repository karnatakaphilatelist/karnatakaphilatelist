import { STATUS_LABEL } from "@/lib/office-status";
import type { OfficeStatus } from "@/types";

const STYLES: Record<OfficeStatus, string> = {
  unvisited: "bg-postal-soft text-postal-dark",
  planned: "bg-planned-soft text-planned-ink",
  visited: "bg-visited-soft text-visited-ink",
};

/** Status is always spelled out in text so it never relies on colour alone. */
export function StatusBadge({ status }: { status: OfficeStatus }) {
  return (
    <span
      className={`shrink-0 rounded-sm px-2 py-1 kp-label ${STYLES[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
