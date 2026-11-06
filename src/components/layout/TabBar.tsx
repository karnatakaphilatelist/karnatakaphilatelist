"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath, NAV_ITEMS } from "@/components/layout/nav-items";

/** Bottom navigation for phones: a floating pill with the active tab filled in postal red. */
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="kp-glass-panel shrink-0 px-4 pb-2 pt-1 md:hidden">
      <div className="flex h-16 items-center gap-1">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              data-tour={`tab-${label.toLowerCase()}`}
              aria-current={active ? "page" : undefined}
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
