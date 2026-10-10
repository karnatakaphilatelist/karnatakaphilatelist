"use client";

import { useState, type FormEvent } from "react";
import { GoogleIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/Sheet";

export type SignInReason = "manual" | "save-progress";

interface AuthDialogProps {
  reason: SignInReason | null;
  onClose: () => void;
  onGoogle: () => Promise<void>;
  onEmail: (email: string) => Promise<void>;
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

export function AuthDialog({ reason, onClose, onGoogle, onEmail }: AuthDialogProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const copy = COPY[reason ?? "manual"];

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

  async function handleGoogle() {
    setError(null);
    try {
      await onGoogle();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Google sign-in failed.");
    }
  }

  return (
    <Sheet
      open={reason !== null}
      onClose={onClose}
      title={copy.title}
      description={copy.description}
    >
      <button
        type="button"
        onClick={handleGoogle}
        className="flex min-h-13 w-full items-center justify-center gap-3 rounded-full border-[1.5px] border-line-strong bg-white text-base font-semibold"
      >
        <GoogleIcon className="size-5" />
        Continue with Google
      </button>

      <div className="my-4 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        or use your email
        <span className="h-px flex-1 bg-line" />
      </div>

      {status === "sent" ? (
        <p role="status" className="rounded-2xl bg-visited-soft p-4 text-sm text-visited-ink">
          Check your inbox. We sent a sign-in link to <strong>{email}</strong>.
        </p>
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

      <button
        type="button"
        onClick={onClose}
        className="mt-2 min-h-12 w-full text-base font-semibold text-muted"
      >
        Maybe later
      </button>
    </Sheet>
  );
}
