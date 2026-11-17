"use client";

import { useToast } from "@/components/providers/ToastProvider";
import { ShareIcon } from "@/components/ui/icons";
import { shareContent } from "@/lib/share";

/** Shares this article's link: the phone's share sheet, or copies the link on a computer. */
export function ShareLearnButton({
  path,
  title,
  text,
  label = "Share",
  className = "",
}: {
  path: string;
  title: string;
  text: string;
  label?: string;
  className?: string;
}) {
  const { showToast } = useToast();

  async function handleShare() {
    const result = await shareContent({
      title,
      text,
      url: `${window.location.origin}${path}`,
    });
    if (result === "copied")
      showToast({ message: "Link copied. Paste it anywhere to share." });
    if (result === "failed")
      showToast({ message: "Could not share. Please try again." });
  }

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-[1.5px] border-ink/25 px-5 text-sm font-bold text-ink ${className}`}
    >
      <ShareIcon className="size-4" />
      {label}
    </button>
  );
}
