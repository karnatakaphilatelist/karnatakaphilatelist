"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath, NAV_ITEMS } from "@/components/layout/nav-items";

/** Bottom navigation for phones; the header carries the links on larger screens. */
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="flex h-[3.75rem] shrink-0 border-t border-line bg-white md:hidden"
    >
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = isActivePath(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${
              active ? "text-postal" : "text-muted"
            }`}
          >
            <Icon className="size-6" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
