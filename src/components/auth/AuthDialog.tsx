"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { GoogleIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/Sheet";
import {
  MIN_PASSWORD_LENGTH,
  validatePassword,
  type PasswordMode,
  type PasswordOutcome,
} from "@/lib/password-auth";

export type SignInReason = "manual" | "save-progress";

interface AuthDialogProps {
  reason: SignInReason | null;
  onClose: () => void;
  /** False when Google sign-in is known to be switched off for this project. */
  googleAvailable: boolean;
  onGoogle: () => Promise<void>;
  /** Sends a one-time sign-in link; also how someone who forgot their password gets back in. */
  onEmail: (email: string) => Promise<void>;
  onPassword: (mode: PasswordMode, email: string, password: string) => Promise<PasswordOutcome>;
}

const COPY: Record<SignInReason, { title: string; description: string }> = {
  manual: {
    title: "Sign in to your passport",
    description: "Track every stamp and keep your notes and photos safe.",
  },
  "save-progress": {
    title: "Keep your stamps safe",
    description:
      "You've collected a few stamps as a guest. Sign in so they follow you to any phone or browser.",
  },
};

type Notice = { kind: "link-sent" | "confirm-email"; email: string };

export function AuthDialog({
  reason,
  onClose,
  googleAvailable,
  onGoogle,
  onEmail,
  onPassword,
}: AuthDialogProps) {
  const [mode, setMode] = useState<PasswordMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [isOpeningGoogle, setIsOpeningGoogle] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const copy = COPY[reason ?? "manual"];
  const isSignUp = mode === "signup";

  // Coming back to this page with the browser's Back button restores it from the
  // cache, so a button left on "Opening Google…" must be re-enabled.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setIsOpeningGoogle(false);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;
    const trimmedEmail = email.trim();
    if (isSignUp) {
      const problem = validatePassword(password);
      if (problem) {
        setError(problem);
        return;
      }
    }
    setIsBusy(true);
    setError(null);
    try {
      const outcome = await onPassword(mode, trimmedEmail, password);
      if (outcome === "confirm-email") setNotice({ kind: "confirm-email", email: trimmedEmail });
      // When signed in, the provider closes this dialog; nothing more to do here.
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSendLink() {
    if (isBusy) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter your email address first, then ask for the link.");
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      await onEmail(trimmedEmail);
      setNotice({ kind: "link-sent", email: trimmedEmail });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send the link.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleGoogle() {
    if (isOpeningGoogle) return;
    setError(null);
    setIsOpeningGoogle(true);
    try {
      await onGoogle();
      // The browser is now heading to Google, so the button stays disabled.
    } catch (caught) {
      setIsOpeningGoogle(false);
      setError(caught instanceof Error ? caught.message : "Google sign-in failed.");
    }
  }

  function switchMode(next: PasswordMode) {
    setMode(next);
    setError(null);
  }

  function backToForm() {
    setNotice(null);
    setError(null);
  }

  return (
    <Sheet
      open={reason !== null}
      onClose={onClose}
      title={copy.title}
      description={copy.description}
    >
      {notice ? (
        <div>
          <p role="status" className="rounded-2xl bg-visited-soft p-4 text-sm text-visited-ink">
            {notice.kind === "link-sent" ? (
              <>
                Check your inbox. We sent a sign-in link to <strong>{notice.email}</strong>. Open it
                on this device to finish signing in.
              </>
            ) : (
              <>
                Almost there. We sent a confirmation link to <strong>{notice.email}</strong>. Open it
                to activate your account, then sign in.
              </>
            )}
          </p>
          <button
            type="button"
            onClick={backToForm}
            className="mt-2 min-h-12 w-full text-base font-semibold text-focus"
          >
            Back
          </button>
        </div>
      ) : (
        <>
          {googleAvailable ? (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={isOpeningGoogle}
                className="flex min-h-13 w-full items-center justify-center gap-3 rounded-full border-[1.5px] border-line-strong bg-white text-base font-semibold disabled:opacity-60"
              >
                <GoogleIcon className="size-5" />
                {isOpeningGoogle ? "Opening Google…" : "Continue with Google"}
              </button>

              <div className="my-4 flex items-center gap-3 text-xs text-muted">
                <span className="h-px flex-1 bg-line" />
                or use your email
                <span className="h-px flex-1 bg-line" />
              </div>
            </>
          ) : (
            <p className="mb-4 rounded-2xl bg-planned-soft p-3.5 text-sm text-[#4a3600]">
              Google sign-in is not available right now. You can still sign in with your email below.
            </p>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <label htmlFor="auth-email" className="block text-sm font-semibold">
              Email address
            </label>
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="h-12 w-full rounded-xl border border-line-strong px-4 text-base"
            />

            <label htmlFor="auth-password" className="block text-sm font-semibold">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              required
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={isSignUp ? MIN_PASSWORD_LENGTH : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isSignUp ? `At least ${MIN_PASSWORD_LENGTH} characters` : "Your password"}
              className="h-12 w-full rounded-xl border border-line-strong px-4 text-base"
            />

            <button
              type="submit"
              disabled={isBusy}
              className="min-h-13 w-full rounded-full bg-ink text-base font-semibold text-white disabled:opacity-60"
            >
              {isBusy ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
            </button>
          </form>

          <div className="mt-3 flex flex-col items-center gap-1 text-sm">
            <button
              type="button"
              onClick={() => switchMode(isSignUp ? "signin" : "signup")}
              className="min-h-11 font-semibold text-focus"
            >
              {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
            </button>
            <button
              type="button"
              onClick={handleSendLink}
              disabled={isBusy}
              className="min-h-11 text-muted underline disabled:opacity-60"
            >
              {isSignUp ? "Skip the password: email me a sign-in link" : "Forgot password? Email me a sign-in link"}
            </button>
          </div>
        </>
      )}

      {error ? (
        <p role="alert" className="mt-3 text-sm text-postal-dark">
          {error}
        </p>
      ) : null}

      <p className="mt-4 text-center text-xs text-muted">
        By continuing you agree to the{" "}
        <Link href="/terms" target="_blank" rel="noopener noreferrer" className="underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">
          Privacy Policy
        </Link>
        .
      </p>

      <button
        type="button"
        onClick={onClose}
        className="mt-1 min-h-12 w-full text-base font-semibold text-muted"
      >
        Maybe later
      </button>
    </Sheet>
  );
}
