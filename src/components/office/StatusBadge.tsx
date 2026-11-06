import { CheckIcon } from "@/components/ui/icons";
import type { OfficeStatus } from "@/types";

const STYLES: Record<OfficeStatus, string> = {
  unvisited: "bg-[#8f640f]/12 text-[#8f640f]",
  planned: "bg-[#2f4aa8]/10 text-[#2f4aa8]",
  visited: "bg-[#1f8a4d]/12 text-[#14653f]",
};

const LABEL: Record<OfficeStatus, string> = {
  unvisited: "Not yet stamped",
  planned: "Planned",
  visited: "Stamped",
};

/** Status is always spelled out in text so it never relies on colour alone. */
export function StatusBadge({
  status,
  stampedOn,
}: {
  status: OfficeStatus;
  stampedOn?: string;
}) {
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-[11px] font-bold uppercase tracking-[0.14em] ${STYLES[status]}`}
    >
      {status === "visited" ? (
        <CheckIcon className="size-3.5" strokeWidth={3.2} />
      ) : (
        <span aria-hidden className="size-1.5 rounded-full bg-current" />
      )}
      {LABEL[status]}
      {status === "visited" && stampedOn ? ` ${stampedOn}` : ""}
    </span>
  );
}
