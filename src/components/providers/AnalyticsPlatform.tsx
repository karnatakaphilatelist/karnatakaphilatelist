"use client";

import { useEffect } from "react";
import { setPlatform } from "@/lib/analytics";
import { isNativeApp } from "@/lib/native";

/** Tells Analytics whether this visit is the app or the website. Renders nothing. */
export function AnalyticsPlatform() {
  useEffect(() => {
    setPlatform(isNativeApp() ? "app" : "web");
  }, []);
  return null;
}
