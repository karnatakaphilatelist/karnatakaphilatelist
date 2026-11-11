// jsdom does not implement the modal <dialog> methods, so give it minimal ones.
export function polyfillDialog() {
  HTMLDialogElement.prototype.showModal ??= function showModal(
    this: HTMLDialogElement
  ) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function close(
    this: HTMLDialogElement
  ) {
    this.removeAttribute("open");
  };
}
