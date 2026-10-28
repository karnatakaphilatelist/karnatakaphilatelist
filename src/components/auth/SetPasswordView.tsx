"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { friendlyPasswordError, validatePassword } from "@/lib/password-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/** Lets a signed-in person set or change their password; also the landing page of the reset email. */
export function SetPasswordView() {
  const { user, isLoading, openSignIn } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;
    const problem = validatePassword(password);
    if (problem) return setError(problem);
    if (password !== confirm)
      return setError("The two passwords do not match.");
    setIsBusy(true);
    setError(null);
    const { error: updateError } =
      await getSupabaseBrowserClient().auth.updateUser({ password });
    setIsBusy(false);
    if (updateError)
      return setError(friendlyPasswordError(updateError, "signup", "update"));
    setDone(true);
  }

  if (isLoading) {
    return (
      <div role="status" className="grid h-full place-items-center text-muted">
        Loading…
      </div>
    );
  }

  const field =
    "mt-1 min-h-12 w-full rounded-xl border border-line-strong bg-white px-4 text-base";

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-md px-5 pb-10 pt-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Set a password
        </h1>

        {!user ? (
          <div className="mt-4 rounded-[18px] border border-line bg-white p-5">
            <p className="text-sm text-muted">
              Sign in first to set a password. If you came from a reset email
              and ended up here, the link may have been opened in a different
              browser or has expired. Ask for a new one from the sign-in box.
            </p>
            <button
              type="button"
              onClick={() => openSignIn("manual")}
              className="mt-4 min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-white"
            >
              Sign in
            </button>
          </div>
        ) : done ? (
          <div
            role="status"
            className="mt-4 rounded-[18px] border border-line bg-white p-5"
          >
            <p className="font-semibold text-visited-ink">
              Your password is saved.
            </p>
            <p className="mt-1 text-sm text-muted">
              Next time you can sign in with {user.email ?? "your email"} and
              this password.
            </p>
            <Link
              href="/passport"
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-postal px-5 text-sm font-semibold text-white"
            >
              Back to my passport
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-4 rounded-[18px] border border-line bg-white p-5"
          >
            <p className="text-sm text-muted">
              Signed in as {user.email ?? "you"}. Choose a password of at least
              8 characters.
            </p>
            <label className="mt-4 block text-sm font-semibold">
              New password
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={field}
              />
            </label>
            <label className="mt-3 block text-sm font-semibold">
              Repeat it
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                className={field}
              />
            </label>
            {error ? (
              <p role="alert" className="mt-3 text-sm text-postal-dark">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isBusy}
              className="mt-4 min-h-12 w-full rounded-full bg-ink text-base font-semibold text-white disabled:opacity-60"
            >
              {isBusy ? "Saving…" : "Save password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
