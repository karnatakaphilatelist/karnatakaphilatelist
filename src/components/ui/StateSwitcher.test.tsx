import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StateSwitcher } from "@/components/ui/StateSwitcher";

afterEach(cleanup);

describe("StateSwitcher", () => {
  it("lists live states and reports the choice", () => {
    const onChange = vi.fn();
    render(
      <StateSwitcher
        states={[
          { code: "KA", name: "Karnataka", count: 99 },
          { code: "TN", name: "Tamil Nadu", count: 58 },
        ]}
        value="KA"
        onChange={onChange}
        idSuffix="test"
      />
    );
    expect(
      screen.getByRole("option", { name: "Karnataka · 99 post offices" })
    ).toBeDefined();
    expect(
      screen.getByRole("option", { name: "Tamil Nadu · 58 post offices" })
    ).toBeDefined();
    fireEvent.change(screen.getByLabelText("State"), {
      target: { value: "KA" },
    });
    expect(onChange).toHaveBeenCalledWith("KA");
  });
});
