/**
 * Haptic feedback helpers — thin wrappers around @capacitor/haptics that
 * silently no-op in the browser or when the plugin is unavailable.
 *
 * Usage:
 *   import { hapticTap, hapticCollect, hapticError } from "@/lib/haptics";
 *   hapticTap();          // light tap for a standard button press
 *   hapticCollect();      // success + medium notch for stamping a post office
 *   hapticError();        // error pattern for failed actions
 */

import { isNativeApp } from "@/lib/native";

type HapticFn = () => Promise<void>;

function safe(fn: () => Promise<void>): HapticFn {
  return async () => {
    if (!isNativeApp()) return;
    try {
      await fn();
    } catch {
      // Plugin unavailable or permission denied — silently ignore.
    }
  };
}

/** Light tap feedback for button presses, sheet opens, etc. */
export const hapticTap: HapticFn = safe(async () => {
  const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
  await Haptics.impact({ style: ImpactStyle.Light });
});

/** Medium tap feedback for map pin selections, list item taps. */
export const hapticSelect: HapticFn = safe(async () => {
  const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
  await Haptics.impact({ style: ImpactStyle.Medium });
});

/**
 * "Stamp collected" celebration feedback — a heavy thump matching the thump
 * animation on the stamp in the UI.
 */
export const hapticCollect: HapticFn = safe(async () => {
  const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
  // Heavy hit followed quickly by a success buzz — feels like an ink stamp.
  await Haptics.impact({ style: ImpactStyle.Heavy });
  await new Promise((r) => setTimeout(r, 60));
  await Haptics.notification({ type: NotificationType.Success });
});

/**
 * "Stamp removed" or "action undone" — softer double-tap.
 */
export const hapticRemove: HapticFn = safe(async () => {
  const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
  await Haptics.impact({ style: ImpactStyle.Medium });
  await new Promise((r) => setTimeout(r, 80));
  await Haptics.impact({ style: ImpactStyle.Light });
});

/** Error feedback for failed saves, auth errors, etc. */
export const hapticError: HapticFn = safe(async () => {
  const { Haptics, NotificationType } = await import("@capacitor/haptics");
  await Haptics.notification({ type: NotificationType.Error });
});

/** Selection-changed feedback for state switcher, filter changes. */
export const hapticSelectionChanged: HapticFn = safe(async () => {
  const { Haptics } = await import("@capacitor/haptics");
  await Haptics.selectionChanged();
});
