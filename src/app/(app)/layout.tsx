import type { ReactNode } from "react";
import { ExploreHostLoader } from "@/components/explore/ExploreHostLoader";
import { AppShell } from "@/components/layout/AppShell";

/**
 * Every screen except the landing page and the welcome tour sits inside the app frame (top bar, tab bar).
 * Those two live in the (bare) group, so they can never receive the frame, whatever the route resolves to
 * while the page is being prerendered.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell explore={<ExploreHostLoader />}>{children}</AppShell>;
}
