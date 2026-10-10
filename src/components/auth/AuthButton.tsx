"use client";

import { useAuth } from "@/components/providers/AuthProvider";

export function AuthButton() {
  const { user, isLoading, openSignIn, signOut } = useAuth();

  // Reserve the space while the session loads so the header does not jump.
  if (isLoading) return <div aria-hidden="true" className="h-11 w-24" />;

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => openSignIn()}
        className="min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-white"
      >
        Sign in
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span
        title={user.email ?? undefined}
        className="grid size-9 place-items-center rounded-full bg-visited-soft text-sm font-bold uppercase text-visited-ink"
      >
        {(user.email ?? "?").charAt(0)}
      </span>
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
