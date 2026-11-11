import type { ReactNode } from "react";

/** A soft placeholder block in the warm palette. Pulses unless motion is reduced or Lite mode is on. */
export function Bone({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block animate-pulse bg-[#785a1e]/10 motion-reduce:animate-none ${className}`}
    />
  );
}

/**
 * Loading state for a page: shows the page's real heading and placeholder shapes that match the
 * layout about to appear, so nothing jumps when the content arrives. Screen readers hear "Loading".
 */
export function PageSkeleton({
  heading,
  children,
  className = "mx-auto max-w-md px-4 pb-10 pt-6",
}: {
  heading?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="h-full overflow-y-auto">
      <div role="status" className={className}>
        <span className="sr-only">Loading…</span>
        {heading}
        {children}
      </div>
    </div>
  );
}

/** The placeholder for a single-field form card (name, password). */
export function FormCardSkeleton({ fields = 1 }: { fields?: number }) {
  return (
    <div className="kp-glass mt-4 rounded-[18px] p-5">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className={i ? "mt-4" : ""}>
          <Bone className="h-4 w-24 rounded" />
          <Bone className="mt-2 h-12 w-full rounded-xl" />
        </div>
      ))}
      <Bone className="mt-5 h-14 w-full rounded-full" />
    </div>
  );
}
