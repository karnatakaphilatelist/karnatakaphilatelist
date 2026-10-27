"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { GoogleIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/Sheet";

export type SignInReason = "manual" | "save-progress";

interface AuthDialogProps {
  reason: SignInReason | null;
  onClose: () => void;
  /** False when Google sign-in is known to be switched off for this project. */
  googleAvailable: boolean;
  onGoogle: () => Promise<void>;
  onEmail: (email: string) => Promise<void>;
  onVerifyCode: (email: string, code: string) => Promise<void>;
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

/** Email codes are numeric; Supabase allows 6 to 10 digits. */
const CODE_PATTERN = /^\d{6,10}$/;

export function AuthDialog({
  reason,
  onClose,
  googleAvailable,
  onGoogle,
  onEmail,
  onVerifyCode,
}: AuthDialogProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [isOpeningGoogle, setIsOpeningGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = COPY[reason ?? "manual"];

  // Coming back to this page with the browser's Back button restores it from the
  // cache, so a button left on "Opening Google…" must be re-enabled.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setIsOpeningGoogle(false);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      await onEmail(email.trim());
      setStatus("sent");
    } catch (caught) {
      setStatus("idle");
      setError(caught instanceof Error ? caught.message : "Could not send the link.");
    }
  }

  async function handleCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = code.replace(/\s/g, "");
    if (!CODE_PATTERN.test(trimmed)) {
      setError("Enter the 6-digit code from the email.");
      return;
    }
    setIsCheckingCode(true);
    setError(null);
    try {
      await onVerifyCode(email.trim(), trimmed);
      // Signing in closes this dialog; nothing more to do here.
    } catch {
      setError("That code did not work. Check it, or go back and ask for a new one.");
    } finally {
      setIsCheckingCode(false);
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

  function handleUseDifferentEmail() {
    setStatus("idle");
    setCode("");
    setError(null);
  }

  return (
    <Sheet
      open={reason !== null}
      onClose={onClose}
      title={copy.title}
      description={copy.description}
    >
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

      {status === "sent" ? (
        <div>
          <p role="status" className="rounded-2xl bg-visited-soft p-4 text-sm text-visited-ink">
            Check your inbox. We sent a sign-in link to <strong>{email}</strong>.
          </p>

          <form onSubmit={handleCodeSubmit} className="mt-4 space-y-3">
            <label htmlFor="auth-code" className="block text-sm font-semibold">
              Opened the email on another device or browser? Enter the 6-digit code from it.
            </label>
            <input
              id="auth-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={11}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="123456"
              className="h-12 w-full rounded-xl border border-line-strong px-4 text-base tracking-widest"
            />
            <button
              type="submit"
              disabled={isCheckingCode}
              className="min-h-13 w-full rounded-full bg-ink text-base font-semibold text-white disabled:opacity-60"
            >
              {isCheckingCode ? "Checking…" : "Sign in with code"}
            </button>
          </form>

          <button
            type="button"
            onClick={handleUseDifferentEmail}
            className="mt-2 min-h-12 w-full text-base font-semibold text-focus"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleEmailSubmit} className="space-y-3">
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
          <button
            type="submit"
            disabled={status === "sending"}
            className="min-h-13 w-full rounded-full bg-ink text-base font-semibold text-white disabled:opacity-60"
          >
            {status === "sending" ? "Sending link…" : "Email me a sign-in link"}
          </button>
        </form>
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
