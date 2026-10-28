import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StateSwitcher } from "@/components/ui/StateSwitcher";

afterEach(cleanup);

describe("StateSwitcher", () => {
  it("lists live states, shows Tamil Nadu as coming soon, and reports the choice", () => {
    const onChange = vi.fn();
    render(
      <StateSwitcher
        states={[{ code: "KA", name: "Karnataka", count: 99 }]}
        value="KA"
        onChange={onChange}
        idSuffix="test"
      />
    );
    expect(
      screen.getByRole("option", { name: "Karnataka · 99 post offices" })
    ).toBeDefined();
    const soon = screen.getByRole("option", {
      name: "Tamil Nadu · coming soon",
    }) as HTMLOptionElement;
    expect(soon.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("State"), {
      target: { value: "KA" },
    });
    expect(onChange).toHaveBeenCalledWith("KA");
  });
});
