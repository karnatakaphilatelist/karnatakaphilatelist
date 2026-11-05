import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Sheet } from "@/components/ui/Sheet";

// jsdom does not implement the modal <dialog> methods, so give it minimal ones.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
});

afterEach(cleanup);

describe("Sheet", () => {
  it("gives every sheet its own title id so each dialog is named by its own heading", () => {
    const { container } = render(
      <>
        <Sheet open={false} onClose={() => undefined} title="Sign in to your passport">
          one
        </Sheet>
        <Sheet open={false} onClose={() => undefined} title="Your visit">
          two
        </Sheet>
      </>,
    );

    const dialogs = [...container.querySelectorAll("dialog")];
    expect(dialogs).toHaveLength(2);

    const labelIds = dialogs.map((dialog) => dialog.getAttribute("aria-labelledby"));
    expect(new Set(labelIds).size).toBe(2);

    dialogs.forEach((dialog, index) => {
      const heading = dialog.querySelector("h2");
      expect(heading?.id).toBe(labelIds[index]);
    });
    expect(container.querySelectorAll("#sheet-title")).toHaveLength(0);
  });

  it("closes when the backdrop is pressed and released", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Sheet open onClose={onClose} title="Sign in">
        <input aria-label="Email" />
      </Sheet>,
    );
    const dialog = container.querySelector("dialog")!;
    fireEvent.pointerDown(dialog);
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when a tap on a field ends up on the backdrop after the layout moves", () => {
    const onClose = vi.fn();
    const { container, getByLabelText } = render(
      <Sheet open onClose={onClose} title="Sign in">
        <input aria-label="Email" />
      </Sheet>,
    );
    const dialog = container.querySelector("dialog")!;
    fireEvent.pointerDown(getByLabelText("Email"));
    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("keeps the sheet open when Back is used to hide the keyboard", () => {
    const { container, getByLabelText } = render(
      <Sheet open onClose={() => undefined} title="Sign in">
        <input aria-label="Email" />
      </Sheet>,
    );
    const dialog = container.querySelector("dialog")!;
    const input = getByLabelText("Email");
    input.focus();
    const event = new Event("cancel", { cancelable: true });
    dialog.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).not.toBe(input);
  });
});
