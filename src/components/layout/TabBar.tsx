"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath, NAV_ITEMS } from "@/components/layout/nav-items";
import { useOverlay } from "@/components/providers/OverlayProvider";
import { EXPLORE_RESET_EVENT } from "@/lib/constants";

/** Bottom navigation for phones: a floating pill with the active tab filled in postal red. */
export function TabBar() {
  const pathname = usePathname();
  const { sheetOpen } = useOverlay();

  // The office detail card is a phone-only bottom sheet sized to leave room for this
  // bar, which used to leave an odd sliver of tab bar peeking out below it. Hiding the
  // bar while a sheet is open reads as one continuous surface instead.
  if (sheetOpen) return null;

  return (
    <nav
      aria-label="Primary"
      className="kp-tabbar shrink-0 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 md:hidden"
    >
      <div className="flex h-16 items-center gap-1">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              data-tour={`tab-${label.toLowerCase()}`}
              aria-current={active ? "page" : undefined}
              // Tapping the tab you're already on doesn't navigate (same URL), so for
              // Explore — the one screen that stays mounted with its own filters,
              // search and open cards — fire a reset instead of doing nothing.
              onClick={(event) => {
                if (active && href === "/explore") {
                  event.preventDefault();
                  window.dispatchEvent(new Event(EXPLORE_RESET_EVENT));
                }
              }}
              className={`flex h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-xs font-semibold ${
                active ? "bg-postal/10 font-bold text-postal" : "text-muted"
              }`}
            >
              <Icon className="size-[22px]" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
