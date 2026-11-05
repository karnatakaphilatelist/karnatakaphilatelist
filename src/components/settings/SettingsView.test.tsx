import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsView } from "@/components/settings/SettingsView";
import { COACH_EVENT, LITE_MODE_KEY } from "@/lib/constants";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

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

  it("starts the walkthrough again from the map", () => {
    const started = vi.fn();
    window.addEventListener(COACH_EVENT, started);
    render(<SettingsView />);
    fireEvent.click(screen.getByRole("button", { name: /replay the walkthrough/i }));
    expect(push).toHaveBeenCalledWith("/explore");
    expect(started).toHaveBeenCalled();
    window.removeEventListener(COACH_EVENT, started);
  });
});
