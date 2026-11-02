"use client";

import { useEffect } from "react";
import { applyLiteMode, readLiteMode } from "@/components/settings/lite-mode";

/** Applies the saved Lite mode choice on every page load. Renders nothing. */
export function LiteModeApplier() {
  useEffect(() => {
    applyLiteMode(readLiteMode());
  }, []);
  return null;
}
