"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Bone, FormCardSkeleton, PageSkeleton } from "@/components/ui/Skeleton";
import { loadSupabase } from "@/lib/supabase/lazy";
import { getDisplayName } from "@/lib/user-display";

export const MAX_NAME = 60;

/** Lets a signed-in person change the name shown on their account. */
export function EditProfileView() {
  const { user, isLoading, openSignIn } = useAuth();
  const [name, setName] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;
    const value = (name ?? "").trim();
    if (!value) return setError("Please enter a name.");
    setIsBusy(true);
    setError(null);
    const { error: updateError } = await (
      await loadSupabase()
    ).auth.updateUser({ data: { full_name: value.slice(0, MAX_NAME) } });
    setIsBusy(false);
    if (updateError)
      return setError("Could not save your name. Please try again.");
    setDone(true);
  }

  if (isLoading) {
    return (
      <PageSkeleton
        heading={
          <>
            <Bone className="my-3.5 h-4 w-20 rounded" />
            <h1 className="mt-2 text-5xl font-medium uppercase leading-[52px] tracking-[0.01em] -ml-0.5">
              Your profile
            </h1>
          </>
        }
      >
        <FormCardSkeleton />
      </PageSkeleton>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-md px-4 pb-10 pt-6">
        <Link
          href="/account"
          className="flex min-h-11 items-center text-sm font-semibold text-muted"
        >
          ← Account
        </Link>
        <h1 className="mt-2 text-5xl font-medium uppercase leading-[52px] tracking-[0.01em] -ml-0.5">
          Your profile
        </h1>

        {!user ? (
          <div className="kp-glass mt-4 rounded-[18px] p-5">
            <p className="text-sm text-muted">Sign in to edit your profile.</p>
            <button
              type="button"
              onClick={() => openSignIn("manual")}
              className="mt-4 min-h-11 rounded-full bg-postal px-5 text-sm font-bold text-white"
            >
              Sign in
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="kp-glass mt-4 rounded-[18px] p-5"
          >
            <label htmlFor="profile-name" className="text-sm font-semibold">
              Your name
            </label>
            <input
              id="profile-name"
              value={name ?? getDisplayName(user) ?? ""}
              maxLength={MAX_NAME}
              onChange={(event) => {
                setName(event.target.value);
                setDone(false);
              }}
              className="mt-1 min-h-12 w-full rounded-xl border border-line-strong bg-white px-4 text-base"
            />
            {error ? (
              <p role="alert" className="mt-2 text-sm text-warn">
                {error}
              </p>
            ) : null}
            {done ? (
              <p
                role="status"
                className="mt-2 text-sm font-semibold text-visited-ink"
              >
                Saved.
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isBusy}
              className="mt-4 min-h-[62px] w-full rounded-full bg-gradient-to-b from-[#e0334a] to-postal text-base font-bold uppercase tracking-[0.12em] text-white disabled:opacity-60"
            >
              {isBusy ? "Saving…" : "Save"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
