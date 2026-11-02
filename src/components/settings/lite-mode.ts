import { LITE_MODE_KEY } from "@/lib/constants";
import { readJson, writeJson } from "@/lib/local-storage";

/** Reflects the saved Lite mode choice onto <html data-lite>, which the stylesheet reads. */
export function applyLiteMode(on: boolean) {
  if (on) document.documentElement.setAttribute("data-lite", "");
  else document.documentElement.removeAttribute("data-lite");
}

export function readLiteMode(): boolean {
  return readJson<boolean>(LITE_MODE_KEY, false);
}

export function saveLiteMode(on: boolean) {
  writeJson(LITE_MODE_KEY, on);
  applyLiteMode(on);
}
