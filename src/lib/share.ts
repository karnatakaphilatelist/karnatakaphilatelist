import { isNativeApp } from "@/lib/native";

export type ShareResult = "shared" | "copied" | "failed";

interface ShareContent {
  title: string;
  text: string;
  url: string;
}

/** The sentence shared from the passport page. */
export function progressShareText(
  stamped: number,
  total: number,
  state: string
): string {
  if (stamped === 0)
    return `I'm starting my post office stamp passport for ${state}.`;
  return `I've collected ${stamped} of ${total} post office stamps in ${state}.`;
}

/** Opens the phone's share sheet; on a computer falls back to the browser's, then to copying. */
export async function shareContent({
  title,
  text,
  url,
}: ShareContent): Promise<ShareResult> {
  try {
    if (isNativeApp()) {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title, text, url, dialogTitle: title });
      return "shared";
    }
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      await navigator.share({ title, text, url });
      return "shared";
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    return "copied";
  } catch (error) {
    // Closing the share sheet is not an error worth showing.
    if (error instanceof Error && error.name === "AbortError") return "shared";
    return "failed";
  }
}
