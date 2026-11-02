"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { TabBar } from "@/components/layout/TabBar";

/**
 * Page frame: top bar, scrolling content area, and a bottom tab bar on phones.
 * The landing page (`/`) and the welcome tour (`/welcome`) draw their own full-screen layouts, so they get no frame.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/welcome") return <>{children}</>;

  return (
    <div className="flex h-dvh flex-col">
      <AppHeader />
      <OfflineBanner />
      <main className="min-h-0 flex-1">{children}</main>
      <TabBar />
    </div>
  );
}
