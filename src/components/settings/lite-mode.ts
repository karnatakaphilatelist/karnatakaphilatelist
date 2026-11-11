import { LITE_MODE_KEY } from "@/lib/constants";
import { readJson, writeJson } from "@/lib/local-storage";

/** Reflects the saved Lite mode choice onto <html data-lite>, which the stylesheet reads. */
export function applyLiteMode(on: boolean) {
  if (on) document.documentElement.setAttribute("data-lite", "");
  else document.documentElement.removeAttribute("data-lite");
}

/** The person's own choice, or null when they never made one (older phones then get Lite automatically). */
export function readLiteChoice(): boolean | null {
  return readJson<boolean | null>(LITE_MODE_KEY, null);
}

/** Whether Lite mode is on right now: the saved choice, else what the page decided for this device. */
export function readLiteMode(): boolean {
  const choice = readLiteChoice();
  if (choice !== null) return choice;
  return (
    typeof document !== "undefined" &&
    document.documentElement.hasAttribute("data-lite")
  );
}

export function saveLiteMode(on: boolean) {
  writeJson(LITE_MODE_KEY, on);
  applyLiteMode(on);
}
