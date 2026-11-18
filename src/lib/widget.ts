/**
 * Widget update helper — tells the iOS home-screen widget about the latest
 * stamp counts via the native PhilatrailPlugin.
 *
 * Safe to call from the browser or Android (no-op on non-iOS or when the
 * plugin is not registered).
 */
import { isNativeApp } from "@/lib/native";

interface WidgetData {
  stampsKA: number;
  stampsKATotal: number;
  stampsTN: number;
  stampsTNTotal: number;
}

export async function updateWidget(data: WidgetData): Promise<void> {
  if (!isNativeApp()) return;
  try {
    // The plugin is registered by AppDelegate on iOS only.
    const { registerPlugin } = await import("@capacitor/core");
    const plugin = registerPlugin<{
      updateWidget: (data: WidgetData) => Promise<void>;
    }>("Philatrail");
    await plugin.updateWidget(data);
  } catch {
    // Plugin not available (e.g. Android, or widget not yet set up) — silently ignore.
  }
}
