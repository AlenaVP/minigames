// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { lockButton, unlockButton } from './button-lock';

function makeButton(): HTMLButtonElement {
  const button = document.createElement('button');
  document.body.append(button);
  return button;
}

/** What Chrome does to a focused button that becomes disabled: the focus falls back to <body> */
function dropFocus(): void {
  const elsewhere = makeButton();
  elsewhere.focus();
  elsewhere.remove();
}

describe('lockButton / unlockButton', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('locks: disabled, the pending class and aria-busy — and unlocks all of it', () => {
    const button = makeButton();

    lockButton(button, 'x--pending');
    expect(button.disabled).toBe(true);
    expect(button.classList.contains('x--pending')).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');

    unlockButton(button, 'x--pending', false);
    expect(button.disabled).toBe(false);
    expect(button.classList.contains('x--pending')).toBe(false);
    expect(button.hasAttribute('aria-busy')).toBe(false);
  });

  it('brings the focus back when it fell to <body> while locked', () => {
    const button = makeButton();
    button.focus();

    const hadFocus = lockButton(button, 'p');
    dropFocus();
    unlockButton(button, 'p', hadFocus);

    expect(hadFocus).toBe(true);
    expect(document.activeElement).toBe(button);
  });

  it('does not steal the focus from where the user has moved on', () => {
    const button = makeButton();
    const other = makeButton();
    button.focus();

    const hadFocus = lockButton(button, 'p');
    other.focus();
    unlockButton(button, 'p', hadFocus);

    expect(document.activeElement).toBe(other);
  });
});
