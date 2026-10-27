"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { TabBar } from "@/components/layout/TabBar";

/**
 * Page frame: top bar, scrolling content area, and a bottom tab bar on phones.
 * The landing page (`/`) draws its own full-screen layout, so it gets no frame.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return <>{children}</>;

  return (
    <div className="flex h-dvh flex-col">
      <AppHeader />
      <main className="min-h-0 flex-1">{children}</main>
      <TabBar />
    </div>
  );
}
