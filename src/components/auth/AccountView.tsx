"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { ChevronRightIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/Sheet";
import { readLiteMode, saveLiteMode } from "@/components/settings/lite-mode";
import { COACH_EVENT, CONTACT_EMAIL, DISCLAIMER } from "@/lib/constants";
import { shareContent } from "@/lib/share";
import { getAvatarUrl, getDisplayName, getInitial } from "@/lib/user-display";

const ROW =
  "flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left text-base font-medium";

function Row({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ChevronRightIcon className="size-5 shrink-0 text-muted" />
    </>
  );
}

/** Account home for phones: who you are, sign-in options, and the small print. */
export function AccountView() {
  const { user, isLoading, openSignIn, signOut, deleteAccount } = useAuth();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { showToast } = useToast();
  const avatarUrl = user ? getAvatarUrl(user) : null;
  const [lite, setLite] = useState(() => readLiteMode());

  async function handleShare() {
    const result = await shareContent({
      title: "Philatrail",
      text: "Collect a stamp from every post office in India.",
      url: window.location.origin,
    });
    if (result === "copied")
      showToast({ message: "Link copied. Paste it anywhere to share." });
    if (result === "failed")
      showToast({ message: "Could not share. Please try again." });
  }

  async function handleDelete() {
    if (isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      setConfirming(false);
      showToast({ message: "Your account has been deleted." });
      router.push("/");
    } catch (caught) {
      setDeleteError(
        caught instanceof Error
          ? caught.message
          : "Could not delete your account. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div role="status" className="grid h-full place-items-center text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-md px-4 pb-8 pt-[calc(2rem+env(safe-area-inset-top))] md:pt-8">
        <h1 className="text-[28px] font-bold leading-8 tracking-[-0.01em]">
          Account
        </h1>

        <section className="kp-glass mt-4 rounded-3xl p-4">
          {user ? (
            <div className="flex items-center gap-3.5">
              <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-b from-[#e0334a] to-postal text-2xl font-bold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3)]">
                {avatarUrl ? (
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
              <div className="min-w-0">
                <p className="truncate text-lg font-bold">
                  {getDisplayName(user) ?? "You"}
                </p>
                <p className="truncate font-mono text-[13px] text-muted">
                  {user.email}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
                Your passport
              </p>
              <p className="mt-2 text-2xl font-medium uppercase leading-7 tracking-[0.01em]">
                Keep your stamps safe
              </p>
              <p className="mt-2 text-sm leading-5 text-muted">
                Sign in to keep your passport safe and use it on every device.
              </p>
              <button
                type="button"
                onClick={() => openSignIn("manual")}
                className="mt-4 h-[56px] w-full rounded-full bg-gradient-to-b from-[#e0334a] to-postal text-base font-bold uppercase tracking-[0.14em] text-white shadow-[inset_0_1.5px_0_rgb(255_255_255/0.35),0_8px_18px_-8px_rgb(207_24_48/0.7)]"
              >
                Sign in
              </button>
            </div>
          )}
        </section>

        <ul className="kp-glass mt-4 divide-y divide-[#785a1e]/12 overflow-hidden rounded-3xl">
          {user ? (
            <li>
              <Link href="/account/profile" className={ROW}>
                <Row>Edit profile</Row>
              </Link>
            </li>
          ) : null}
          {user ? (
            <li>
              <Link href="/account/password" className={ROW}>
                <Row>Set or change password</Row>
              </Link>
            </li>
          ) : null}
          <li>
            <button
              type="button"
              onClick={() => {
                router.push("/explore");
                window.dispatchEvent(new Event(COACH_EVENT));
              }}
              className={ROW}
            >
              <Row>Replay the walkthrough</Row>
            </button>
          </li>
          <li className="flex min-h-14 items-center justify-between gap-3 px-4">
            <div>
              <p id="lite-label" className="text-base font-medium">
                Lite mode
              </p>
              <p className="font-mono text-xs text-muted">
                Lighter map, less data
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={lite}
              aria-labelledby="lite-label"
              onClick={() => {
                setLite(!lite);
                saveLiteMode(!lite);
              }}
              className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                lite ? "bg-[#1f8a4d]" : "bg-[#785a1e]/25"
              }`}
            >
              <span
                className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${
                  lite ? "left-7" : "left-1"
                }`}
              />
              <span className="sr-only">{lite ? "On" : "Off"}</span>
            </button>
          </li>
        </ul>

        <ul className="kp-glass mt-4 divide-y divide-[#785a1e]/12 overflow-hidden rounded-3xl">
          <li>
            <button type="button" onClick={handleShare} className={ROW}>
              <Row>Share Philatrail</Row>
            </button>
          </li>
          <li>
            <Link href="/privacy" className={ROW}>
              <Row>Privacy policy</Row>
            </Link>
          </li>
          <li>
            <Link href="/terms" className={ROW}>
              <Row>Terms of use</Row>
            </Link>
          </li>
          <li>
            <a href={`mailto:${CONTACT_EMAIL}`} className={ROW}>
              <Row>Contact us</Row>
            </a>
          </li>
          {user ? (
            <li>
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setConfirming(true);
                }}
                className={`${ROW} text-postal`}
              >
                <Row>Delete account</Row>
              </button>
            </li>
          ) : null}
        </ul>

        {user ? (
          <button
            type="button"
            onClick={() => void signOut()}
            className="kp-glass mt-4 h-14 w-full rounded-full text-base font-bold text-postal"
          >
            Sign out
          </button>
        ) : null}

        <p className="mt-6 text-xs leading-5 text-muted">{DISCLAIMER}</p>

        <Sheet
          open={confirming}
          onClose={() => setConfirming(false)}
          title="Delete your account?"
          description="This permanently removes your account, your stamps, notes and photos. It cannot be undone."
        >
          {deleteError ? (
            <p role="alert" className="mb-3 text-sm text-postal-dark">
              {deleteError}
            </p>
          ) : null}
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="min-h-12 w-full rounded-full bg-gradient-to-b from-[#e0334a] to-postal text-base font-bold text-white disabled:opacity-60"
          >
            {isDeleting ? "Deleting…" : "Yes, delete everything"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={isDeleting}
            className="kp-glass mt-2 min-h-12 w-full rounded-full text-base font-semibold text-ink"
          >
            Keep my account
          </button>
        </Sheet>
      </div>
    </div>
  );
}
