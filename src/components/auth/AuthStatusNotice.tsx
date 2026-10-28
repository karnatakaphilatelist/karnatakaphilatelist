"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import {
  AUTH_FAILURE_MESSAGES,
  isAuthFailureReason,
} from "@/lib/auth-callback";

/** Explains why sign-in did not finish when the callback redirects back with `?auth=failed`. */
export function AuthStatusNotice() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { showToast } = useToast();
  const failed = searchParams.get("auth") === "failed";
  const reasonParam = searchParams.get("reason");

  useEffect(() => {
    if (!failed) return;
    const reason = isAuthFailureReason(reasonParam) ? reasonParam : "failed";
    showToast({ message: AUTH_FAILURE_MESSAGES[reason] });

    // Drop only our own flags so a refresh does not repeat the message,
    // while keeping everything else, such as the office that was open.
    const remaining = new URLSearchParams(window.location.search);
    remaining.delete("auth");
    remaining.delete("reason");
    const query = remaining.toString();
    window.history.replaceState(
      null,
      "",
      query ? `${pathname}?${query}` : pathname
    );
  }, [failed, reasonParam, pathname, showToast]);

  return null;
}
