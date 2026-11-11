"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { isNativeApp } from "@/lib/native";
import { GoogleIcon } from "@/components/ui/icons";
import { HeroSheet } from "@/components/ui/HeroSheet";
import {
  MIN_PASSWORD_LENGTH,
  validatePassword,
  type PasswordMode,
  type PasswordOutcome,
} from "@/lib/password-auth";

export type SignInReason = "manual" | "save-progress" | "welcome";

interface AuthDialogProps {
  reason: SignInReason | null;
  onClose: () => void;
  /** False when Google sign-in is known to be switched off for this project. */
  googleAvailable: boolean;
  onGoogle: () => Promise<void>;
  /** Sends a one-time sign-in link; also how someone who forgot their password gets back in. */
  onEmail: (email: string) => Promise<void>;
  /** Signs in with the 6-digit code from the email (works in the phone app, where links open in a browser). */
  onVerifyCode?: (email: string, code: string) => Promise<void>;
  /** Emails a password-reset link that lands on the set-a-password page. Falls back to `onEmail`. */
  onReset?: (email: string) => Promise<void>;
  onPassword: (
    mode: PasswordMode,
    email: string,
    password: string
  ) => Promise<PasswordOutcome>;
}

const COPY: Record<SignInReason, { title: string; description: string }> = {
  manual: {
    title: "Sign in to your passport",
    description: "Track every stamp and keep your notes and photos safe.",
  },
  welcome: {
    title: "Save your stamps",
    description:
      "Sign in once and your passport follows you to any phone or browser.",
  },
  "save-progress": {
    title: "Keep your stamps safe",
    description:
      "You've collected a few stamps as a guest. Sign in so they follow you to any phone or browser.",
  },
};

type Notice = {
  kind: "link-sent" | "confirm-email";
  email: string;
  withCode?: boolean;
};

export function AuthDialog({
  reason,
  onClose,
  googleAvailable,
  onGoogle,
  onEmail,
  onVerifyCode,
  onReset,
  onPassword,
}: AuthDialogProps) {
  const [mode, setMode] = useState<PasswordMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [isOpeningGoogle, setIsOpeningGoogle] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"choose" | "email">("choose");
  const [showPassword, setShowPassword] = useState(false);
  // Every time the dialog opens it starts on the first step.
  const [lastReason, setLastReason] = useState<SignInReason | null>(null);
  if (reason !== lastReason) {
    setLastReason(reason);
    if (reason !== null) {
      setStep("choose");
      setNotice(null);
      setError(null);
      setMode("signin");
    }
  }

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

  // In the mobile apps Google opens in a separate browser and nothing tells this page when the person
  // comes back (or gives up). Re-enable the button when the app returns to the front, with a time limit as backup.
  useEffect(() => {
    if (!isOpeningGoogle) return;
    let left = false;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") left = true;
      else if (left) setIsOpeningGoogle(false);
    };
    document.addEventListener("visibilitychange", onVisibility);
    let removeAppListener: (() => void) | undefined;
    let cancelled = false;
    if (isNativeApp()) {
      import("@capacitor/app")
        .then(({ App }) =>
          App.addListener("appStateChange", ({ isActive }) => {
            if (!isActive) left = true;
            else if (left) setIsOpeningGoogle(false);
          })
        )
        .then((handle) => {
          if (cancelled) void handle.remove();
          else removeAppListener = () => void handle.remove();
        })
        .catch(() => undefined);
    }
    const timer = window.setTimeout(() => setIsOpeningGoogle(false), 20_000);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      removeAppListener?.();
      window.clearTimeout(timer);
    };
  }, [isOpeningGoogle]);

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
      if (outcome === "confirm-email")
        setNotice({ kind: "confirm-email", email: trimmedEmail });
      // When signed in, the provider closes this dialog; nothing more to do here.
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSendLink(
    kind: "reset" | "magic" = isSignUp ? "magic" : "reset"
  ) {
    if (isBusy) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter your email address first, then ask for the link.");
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      await (kind === "magic" ? onEmail : onReset ?? onEmail)(trimmedEmail);
      setNotice({
        kind: "link-sent",
        email: trimmedEmail,
        withCode: kind === "magic" && !!onVerifyCode,
      });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not send the link."
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy || !notice || !onVerifyCode) return;
    const token = code.replace(/\s/g, "");
    if (!/^\d{6,8}$/.test(token)) {
      setError("Enter the code from the email (6 to 8 digits).");
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      await onVerifyCode(notice.email, token);
      // The provider closes this dialog once the person is signed in.
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "That code did not work."
      );
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
      setError(
        caught instanceof Error ? caught.message : "Google sign-in failed."
      );
    }
  }

  function switchMode(next: PasswordMode) {
    setMode(next);
    setError(null);
  }

  const PRIMARY =
    "flex h-14 w-full items-center justify-center gap-2.5 rounded-[28px] bg-gradient-to-b from-[#e0334a] to-postal text-base font-bold uppercase tracking-[0.14em] text-white shadow-[inset_0_1.5px_0_rgb(255_255_255/0.35),0_8px_18px_-8px_rgb(207_24_48/0.7)] disabled:opacity-60";
  const inEmailStep = step === "email" && !notice;

  const closeButton = (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="grid size-10 place-items-center rounded-full bg-white/20 shadow-[inset_0_1px_0_rgb(255_255_255/0.4)]"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      >
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  );

  const hero = (
    <>
      <svg
        aria-hidden="true"
        viewBox="0 0 390 470"
        className="pointer-events-none absolute right-[-80px] top-[-40px] size-[470px] opacity-100"
      >
        {Array.from({ length: 17 }, (_, i) => (
          <circle
            key={i}
            cx="235"
            cy="190"
            r={24 + i * 16}
            fill="none"
            stroke="#fff"
            strokeOpacity=".08"
          />
        ))}
      </svg>
      <div className="relative flex h-10 items-center justify-between">
        {inEmailStep || notice ? (
          <button
            type="button"
            onClick={() => {
              // From the "check your inbox" screen go back to the form; from the form go back to the start.
              if (!notice) setStep("choose");
              setNotice(null);
              setError(null);
              setCode("");
            }}
            aria-label="Back"
            className="grid size-10 place-items-center rounded-full bg-white/20 shadow-[inset_0_1px_0_rgb(255_255_255/0.4)]"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="size-[18px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>
        ) : (
          <span className="text-xs font-extrabold uppercase tracking-[0.22em]">
            Philatrail
          </span>
        )}
        {closeButton}
      </div>
      {step === "choose" && !notice ? (
        <div className="relative mt-[clamp(2rem,9dvh,5.5rem)]">
          <p className="-ml-1 text-[clamp(44px,15vw,56px)] font-medium uppercase leading-[1.07] tracking-[0.01em]">
            Save your
            <br />
            stamps.
          </p>
          <p className="mt-5 text-lg font-bold italic uppercase leading-6 tracking-[0.08em] text-[#f7c96b]">
            One passport. Every device.
          </p>
        </div>
      ) : (
        <div className="relative mt-8">
          <p className="-ml-0.5 text-[40px] font-medium uppercase leading-[44px] tracking-[0.01em]">
            {notice ? "Check inbox" : isSignUp ? "Create account" : "Sign in"}
          </p>
        </div>
      )}
    </>
  );

  return (
    <HeroSheet
      open={reason !== null}
      onClose={onClose}
      label={copy.title}
      hero={hero}
      compact={step === "email" || notice !== null}
    >
      {notice ? (
        <div>
          <p
            role="status"
            className="rounded-2xl bg-visited-soft p-4 text-sm text-visited-ink"
          >
            {notice.kind === "link-sent" ? (
              <>
                Check your inbox. We sent a sign-in link to{" "}
                <strong>{notice.email}</strong>. Open it on this device to
                finish signing in.
              </>
            ) : (
              <>
                Almost there. We sent a confirmation link to{" "}
                <strong>{notice.email}</strong>. Open it to activate your
                account, then sign in.
              </>
            )}
          </p>
          {notice.withCode ? (
            <form onSubmit={handleVerifyCode} className="mt-4">
              <label htmlFor="auth-code" className="text-sm font-semibold">
                Or enter the code from the email
              </label>
              <input
                id="auth-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="mt-1 min-h-12 w-full rounded-xl border border-line-strong bg-white px-4 text-center font-mono text-xl tracking-[0.3em]"
              />
              <button
                type="submit"
                disabled={isBusy}
                className={`${PRIMARY} mt-3`}
              >
                {isBusy ? "Checking…" : "Verify code"}
              </button>
            </form>
          ) : null}
        </div>
      ) : step === "choose" ? (
        <div className="flex flex-col gap-3">
          {googleAvailable ? (
            <button
              type="button"
              onClick={handleGoogle}
              disabled={isOpeningGoogle}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-[28px] border-[1.5px] border-ink bg-white text-base font-semibold disabled:opacity-60"
            >
              <GoogleIcon className="size-5" />
              {isOpeningGoogle ? "Opening Google…" : "Continue with Google"}
            </button>
          ) : (
            <p className="rounded-2xl bg-planned-soft p-3.5 text-sm text-planned-ink">
              Google sign-in is not available right now. You can still sign in
              with your email.
            </p>
          )}
          <button
            type="button"
            onClick={() => setStep("email")}
            className={PRIMARY}
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            Continue with email
          </button>
        </div>
      ) : (
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
          <FloatingField label="Email" htmlFor="auth-email">
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="absolute inset-0 size-full rounded-[20px] bg-transparent px-[18px] pt-6 text-base outline-none placeholder:text-[#9a9fb5] focus-visible:outline-2 focus-visible:outline-ink"
            />
          </FloatingField>
          <FloatingField label="Password" htmlFor="auth-password">
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={isSignUp ? MIN_PASSWORD_LENGTH : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={
                isSignUp
                  ? `At least ${MIN_PASSWORD_LENGTH} characters`
                  : "Your password"
              }
              className="absolute inset-0 size-full rounded-[20px] bg-transparent px-[18px] pr-14 pt-6 text-base outline-none placeholder:text-[#9a9fb5] focus-visible:outline-2 focus-visible:outline-ink"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-2 grid size-11 place-items-center text-muted"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="size-[22px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {showPassword ? (
                  <>
                    <path d="M3 3l18 18" />
                    <path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.4 6.9C3.8 8.6 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4-.9" />
                  </>
                ) : (
                  <>
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          </FloatingField>

          {error ? (
            <p role="alert" className="text-sm font-semibold text-warn">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={isBusy} className={`${PRIMARY} mt-1`}>
            {isBusy ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
          </button>

          <div className="mt-1 flex items-center justify-between text-sm font-semibold">
            <button
              type="button"
              onClick={() => switchMode(isSignUp ? "signin" : "signup")}
              className="min-h-11 text-ink"
            >
              {isSignUp ? "Sign in instead" : "Create an account"}
            </button>
            {isSignUp ? null : (
              <button
                type="button"
                onClick={() => void handleSendLink("reset")}
                disabled={isBusy}
                className="min-h-11 text-muted disabled:opacity-60"
              >
                Forgot password?
              </button>
            )}
          </div>
          <p className="text-center text-sm text-muted">
            Prefer no password?{" "}
            <button
              type="button"
              onClick={() => void handleSendLink("magic")}
              disabled={isBusy}
              className="min-h-11 font-bold text-postal disabled:opacity-60"
            >
              Email me a sign-in link
            </button>
          </p>
        </form>
      )}

      {error && !inEmailStep ? (
        <p role="alert" className="mt-3 text-sm font-semibold text-warn">
          {error}
        </p>
      ) : null}

      {step === "choose" && !notice ? (
        <button
          type="button"
          onClick={onClose}
          className="mt-1 min-h-12 w-full text-[15px] font-semibold text-muted"
        >
          Maybe later
        </button>
      ) : null}

      <p className="mt-3 text-center text-xs leading-[18px] text-muted">
        By continuing you agree to the{" "}
        <Link
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Terms
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </HeroSheet>
  );
}

/** A field with its label inside the top edge, like the sign-in board. */
function FloatingField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="relative h-[60px] rounded-[20px] bg-white/75 shadow-[inset_0_0_0_1.5px_rgb(140_100_40/0.22)]">
      <label
        htmlFor={htmlFor}
        className="pointer-events-none absolute left-[18px] top-2 z-10 text-[11px] font-bold uppercase leading-[14px] tracking-[0.12em] text-muted"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
