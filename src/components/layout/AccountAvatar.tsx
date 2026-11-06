"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { UserIcon } from "@/components/ui/icons";
import { getAvatarUrl, getInitial } from "@/lib/user-display";

/** The round red account button of direction D: initial or photo when signed in, a person when a guest. */
export function AccountAvatar({
  className = "size-10",
  onWhite = false,
}: {
  className?: string;
  onWhite?: boolean;
}) {
  const { user } = useAuth();
  const avatarUrl = user ? getAvatarUrl(user) : null;
  return (
    <Link
      href="/account"
      aria-label="Your account"
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full text-base font-bold shadow-[inset_0_1px_0_rgb(255_255_255/0.25)] ${
        onWhite ? "bg-white text-postal" : "bg-postal text-white"
      } ${className}`}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="size-full object-cover"
        />
      ) : user ? (
        getInitial(user)
      ) : (
        <UserIcon className="size-5" />
      )}
    </Link>
  );
}
