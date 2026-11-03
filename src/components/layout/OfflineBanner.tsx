"use client";

import { useSyncExternalStore } from "react";
import { AlertIcon } from "@/components/ui/icons";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** A quiet amber strip while the phone has no connection. Amber, not red: red means the brand. */
export function OfflineBanner() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true
  );
  if (online) return null;

  return (
    <div
      role="status"
      className="mx-3 mt-2 flex shrink-0 items-start gap-3 rounded-2xl bg-warn-soft px-4 py-3 text-warn"
    >
      <AlertIcon className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="text-sm font-bold">You&apos;re offline</p>
        <p className="text-sm">
          Post offices already loaded still show. Saving a stamp or photo needs a
          connection.
        </p>
      </div>
    </div>
  );
}
