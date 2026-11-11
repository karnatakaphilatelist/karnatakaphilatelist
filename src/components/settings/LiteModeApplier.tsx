"use client";

import { useEffect } from "react";
import { applyLiteMode, readLiteChoice } from "@/components/settings/lite-mode";

/** Applies the saved Lite mode choice on every page load. Renders nothing. */
export function LiteModeApplier() {
  useEffect(() => {
    // With no saved choice, the automatic setting made in the page head stays.
    const choice = readLiteChoice();
    if (choice !== null) applyLiteMode(choice);
  }, []);
  return null;
}
