"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { ChevronRightIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/Sheet";
import { CONTACT_EMAIL, DISCLAIMER } from "@/lib/constants";
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

  async function handleShare() {
    const result = await shareContent({
      title: "Philatelist",
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
      <div className="mx-auto max-w-md px-5 pb-8 pt-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Account
        </h1>

        <section className="mt-4 rounded-[18px] border border-line bg-white p-4">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-visited-soft text-xl font-bold text-visited-ink">
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
                <p className="truncate text-lg font-semibold">
                  {getDisplayName(user) ?? "You"}
                </p>
                <p className="truncate text-sm text-muted">{user.email}</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="font-semibold">You&apos;re browsing as a guest</p>
              <p className="mt-1 text-sm text-muted">
                Sign in to keep your passport safe and use it on every device.
              </p>
              <button
                type="button"
                onClick={() => openSignIn("manual")}
                className="mt-3 min-h-12 w-full rounded-full bg-ink text-base font-semibold text-white"
              >
                Sign in
              </button>
            </div>
          )}
        </section>

        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[18px] border border-line bg-white">
          {user ? (
            <li>
              <Link href="/account/password" className={ROW}>
                <Row>Set or change password</Row>
              </Link>
            </li>
          ) : null}
          <li>
            <button type="button" onClick={handleShare} className={ROW}>
              <Row>Share Philatelist</Row>
            </button>
          </li>
          <li>
            <Link href="/?tour=1" className={ROW}>
              <Row>Welcome tour</Row>
            </Link>
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
        </ul>

        {user ? (
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-4 min-h-12 w-full rounded-full border-[1.5px] border-line-strong bg-white text-base font-semibold text-postal-dark"
          >
            Sign out
          </button>
        ) : null}

        {user ? (
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setConfirming(true);
            }}
            className="mt-2 min-h-12 w-full rounded-full text-sm font-semibold text-postal-dark"
          >
            Delete my account
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
            className="min-h-12 w-full rounded-full bg-postal text-base font-semibold text-white disabled:opacity-60"
          >
            {isDeleting ? "Deleting…" : "Yes, delete everything"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={isDeleting}
            className="mt-2 min-h-12 w-full rounded-full text-base font-semibold text-ink"
          >
            Keep my account
          </button>
        </Sheet>
      </div>
    </div>
  );
}
