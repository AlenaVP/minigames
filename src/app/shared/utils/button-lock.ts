/**
 * A button that sent a request: disabled (no second click), the pending look (spinner via CSS), aria-busy.
 * Returns whether it had the focus — a disabled button drops it, so unlockButton() can bring it back.
 */
export function lockButton(button: HTMLButtonElement, pendingClass: string): boolean {
  const hadFocus = document.activeElement === button;
  button.disabled = true;
  button.classList.add(pendingClass);
  button.setAttribute('aria-busy', 'true');
  return hadFocus;
}

/** The request is over. The focus goes back only if it fell to <body> meanwhile (the user did not move on) */
export function unlockButton(button: HTMLButtonElement, pendingClass: string, restoreFocus: boolean): void {
  button.disabled = false;
  button.classList.remove(pendingClass);
  button.removeAttribute('aria-busy');
  if (restoreFocus && (document.activeElement === document.body || document.activeElement === null)) button.focus();
}
