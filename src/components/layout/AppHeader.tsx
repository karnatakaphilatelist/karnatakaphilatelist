"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthButton } from "@/components/auth/AuthButton";
import { isActivePath, NAV_ITEMS } from "@/components/layout/nav-items";
import { MailIcon } from "@/components/ui/icons";

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-line bg-card px-4 md:px-6">
      <Link href="/" className="flex items-center gap-3">
        <span className="kp-perforated grid size-9 place-items-center bg-postal text-white">
          <MailIcon className="size-5" />
        </span>
        <span className="font-display text-base font-bold tracking-tight md:text-lg">
          Karnataka Philatelic Passport
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = isActivePath(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-full px-4 text-sm font-semibold ${
                  active ? "bg-postal-soft text-postal-dark" : "text-ink"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <AuthButton />
      </div>
    </header>
  );
}
