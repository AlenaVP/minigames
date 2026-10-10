// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthMode } from '@shared/types/auth';
import { AuthDialog } from '.';

function query<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Nothing matches ${selector}`);
  return element;
}

function type(selector: string, value: string): void {
  const input = query<HTMLInputElement>(selector);
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

const visiblePanelId = (): string | undefined => document.querySelector<HTMLElement>('.auth-form:not([hidden])')?.id;
const visibleErrors = (): number => document.querySelectorAll('.auth-field__error:not([hidden])').length;

describe('AuthDialog', () => {
  let dialog: AuthDialog;
  let onModeChange: ReturnType<typeof vi.fn<(mode: AuthMode) => void>>;

  beforeEach(() => {
    onModeChange = vi.fn<(mode: AuthMode) => void>();
    dialog = new AuthDialog({ onModeChange });
    dialog.mount(document.body);
  });

  afterEach(() => {
    dialog.destroy();
  });

  it('opens on the requested tab', () => {
    dialog.open('signup');

    expect(dialog.isOpen).toBe(true);
    expect(visiblePanelId()).toBe('auth-panel-signup');
    expect(query('#auth-tab-signup').getAttribute('aria-selected')).toBe('true');
  });

  it('switching to Register with the tab clears the Login fields and errors and reports the new mode', () => {
    dialog.open('login');
    type('#login-email', 'alex@');
    type('#login-password', 'abc');
    expect(visibleErrors()).toBe(2);

    query<HTMLButtonElement>('#auth-tab-signup').click();

    expect(visiblePanelId()).toBe('auth-panel-signup');
    expect(onModeChange).toHaveBeenCalledWith('signup');

    query<HTMLButtonElement>('#auth-tab-login').click();
    expect(query<HTMLInputElement>('#login-email').value).toBe('');
    expect(query<HTMLInputElement>('#login-password').value).toBe('');
    expect(visibleErrors()).toBe(0);
  });

  it('the footer link switches mode the same way', () => {
    dialog.open('signup');
    type('#signup-username', 'cozy');

    query<HTMLButtonElement>('#auth-panel-signup .auth-form__switch').click();

    expect(visiblePanelId()).toBe('auth-panel-login');
    expect(onModeChange).toHaveBeenCalledWith('login');
    expect(query<HTMLInputElement>('#signup-username').value).toBe('');
  });

  it('a mode change from the URL (Back/Forward) also starts from clean forms', () => {
    dialog.open('login');
    type('#login-email', 'alex@minigames.com');

    dialog.open('signup');

    expect(visiblePanelId()).toBe('auth-panel-signup');
    expect(query<HTMLInputElement>('#login-email').value).toBe('');
    expect(onModeChange).not.toHaveBeenCalled();
  });

  it('opening again with the same mode keeps what the user typed (idempotent open)', () => {
    dialog.open('login');
    type('#login-email', 'alex@minigames.com');

    dialog.open('login');

    expect(query<HTMLInputElement>('#login-email').value).toBe('alex@minigames.com');
  });

  it('every new opening starts with empty forms', () => {
    dialog.open('login');
    type('#login-email', 'alex@minigames.com');
    dialog.close();

    dialog.open('login');

    expect(query<HTMLInputElement>('#login-email').value).toBe('');
    expect(query<HTMLButtonElement>('#auth-panel-login .auth-form__submit').disabled).toBe(true);
  });
});
