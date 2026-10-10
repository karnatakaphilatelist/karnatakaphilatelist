"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useToast } from "@/components/providers/ToastProvider";

/** Shows a message when the sign-in callback redirects back with `?auth=failed`. */
export function AuthStatusNotice() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { showToast } = useToast();
  const failed = searchParams.get("auth") === "failed";

  useEffect(() => {
    if (!failed) return;
    showToast({ message: "Sign-in did not complete. Please try again." });
    // Drop the flag so a refresh does not repeat the message.
    window.history.replaceState(null, "", pathname);
  }, [failed, pathname, showToast]);

  return null;
}
