"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { getAvatarUrl, getDisplayName, getInitial } from "@/lib/user-display";

export function AuthButton() {
  const { user, isLoading, openSignIn, signOut } = useAuth();

  // Reserve the space while the session loads so the header does not jump.
  if (isLoading) return <div aria-hidden="true" className="h-11 w-24" />;

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => openSignIn()}
        className="min-h-11 whitespace-nowrap rounded-full bg-ink px-5 text-sm font-semibold text-white"
      >
        Sign in
      </button>
    );
  }

  const avatarUrl = getAvatarUrl(user);

  return (
    <div className="flex items-center gap-2">
      <span
        title={getDisplayName(user) ?? undefined}
        className="grid size-9 place-items-center overflow-hidden rounded-full bg-visited-soft text-sm font-bold text-visited-ink"
      >
        {avatarUrl ? (
          // Google profile photos come from another host; a plain img with no referrer avoids hotlink blocks.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="size-full object-cover"
          />
        ) : (
          getInitial(user)
        )}
      </span>
      <Link
        href="/account/password"
        className="hidden min-h-11 items-center rounded-full px-3 text-sm font-semibold text-muted md:flex"
      >
        Password
      </Link>
      <button
        type="button"
        onClick={() => void signOut()}
        className="min-h-11 rounded-full px-3 text-sm font-semibold text-muted"
      >
        Sign out
      </button>
    </div>
  );
}
