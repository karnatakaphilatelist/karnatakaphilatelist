import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { TabBar } from "@/components/layout/TabBar";

/** Page frame: top bar, scrolling content area, and a bottom tab bar on phones. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <AppHeader />
      <main className="min-h-0 flex-1">{children}</main>
      <TabBar />
    </div>
  );
}
