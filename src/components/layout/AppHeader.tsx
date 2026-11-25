"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthButton } from "@/components/auth/AuthButton";
import { isActivePath, NAV_ITEMS } from "@/components/layout/nav-items";
import { EXPLORE_RESET_EVENT } from "@/lib/constants";

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="hidden h-16 shrink-0 items-center justify-between gap-4 border-b border-[#785a1e]/15 bg-[#fffaf0]/85 px-6 backdrop-blur-xl md:flex">
      <Link href="/" className="flex min-h-11 items-center">
        <span className="kp-wordmark" role="img" aria-label="Philatrail" />
      </Link>

      <div className="flex items-center gap-2">
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.filter((item) => !item.phoneOnly).map(
            ({ href, label }) => {
              const active = isActivePath(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  // Same URL means no navigation, so the one screen that stays
                  // mounted with its own filters, search and open cards (Explore)
                  // gets a reset instead of silently doing nothing.
                  onClick={(event) => {
                    if (active && href === "/explore") {
                      event.preventDefault();
                      window.dispatchEvent(new Event(EXPLORE_RESET_EVENT));
                    }
                  }}
                  className={`flex min-h-11 items-center rounded-full px-4 text-sm font-semibold ${
                    active ? "bg-postal-soft text-postal-dark" : "text-ink"
                  }`}
                >
                  {label}
                </Link>
              );
            }
          )}
        </nav>
        <AuthButton />
      </div>
    </header>
  );
}
