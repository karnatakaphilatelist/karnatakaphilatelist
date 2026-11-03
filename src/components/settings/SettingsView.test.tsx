import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SettingsView } from "@/components/settings/SettingsView";
import { LITE_MODE_KEY } from "@/lib/constants";

describe("SettingsView", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    cleanup();
    document.documentElement.removeAttribute("data-lite");
  });

  it("turns Lite mode on and remembers it", () => {
    render(<SettingsView />);
    const toggle = screen.getByRole("switch", { name: /lite mode/i });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(localStorage.getItem(LITE_MODE_KEY)).toBe("true");
    expect(document.documentElement.hasAttribute("data-lite")).toBe(true);
  });
});
