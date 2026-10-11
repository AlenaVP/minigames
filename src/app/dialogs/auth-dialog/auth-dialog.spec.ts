// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthMode, AuthUser } from '@shared/types/auth';
import type { AppSession } from '@shared/types/session';
import { snackbar } from '@shared/ui/snackbar';
import { AuthError } from '@app/services/auth';
import { createFakeAuthProvider, makeAuthUser } from '@testing/auth';
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
  let authProvider: ReturnType<typeof createFakeAuthProvider>;
  let onAuthenticated: ReturnType<typeof vi.fn<(user: AuthUser) => AppSession>>;

  beforeEach(() => {
    onModeChange = vi.fn<(mode: AuthMode) => void>();
    authProvider = createFakeAuthProvider();
    onAuthenticated = vi.fn((user: AuthUser) => ({
      displayName: user.displayName ?? 'Player',
      email: user.email ?? '',
      authenticatedAt: 0,
    }));
    dialog = new AuthDialog({ authProvider, onAuthenticated, onModeChange });
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

/** A Firebase call the test finishes by hand — to look at the dialog WHILE it is pending */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (error: unknown) => void } {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve));

function submit(mode: 'login' | 'signup'): void {
  query<HTMLFormElement>(`#auth-panel-${mode} form`).requestSubmit();
}

const googleButton = (mode: 'login' | 'signup' = 'login'): HTMLButtonElement =>
  query<HTMLButtonElement>(`#auth-panel-${mode} .auth-form__google`);

const loginSubmit = (): HTMLButtonElement => query<HTMLButtonElement>('#auth-panel-login .auth-form__submit');

describe('AuthDialog — email/password authentication', () => {
  let dialog: AuthDialog;
  let authProvider: ReturnType<typeof createFakeAuthProvider>;
  let onAuthenticated: ReturnType<typeof vi.fn<(user: AuthUser) => AppSession>>;
  let onClose: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    authProvider = createFakeAuthProvider();
    onAuthenticated = vi.fn((user: AuthUser) => ({
      displayName: user.displayName ?? 'Player',
      email: user.email ?? '',
      authenticatedAt: 0,
    }));
    onClose = vi.fn<() => void>();
    dialog = new AuthDialog({ authProvider, onAuthenticated, onClose });
    dialog.mount(document.body);
    vi.spyOn(snackbar, 'success');
    vi.spyOn(snackbar, 'error');
    vi.spyOn(snackbar, 'warning');
    vi.spyOn(snackbar, 'info');
  });

  afterEach(() => {
    dialog.destroy();
  });

  function fillLogin(email = 'alex@minigames.com', password = 'Secret1!'): void {
    dialog.open('login');
    type('#login-email', email);
    type('#login-password', password);
  }

  it('a valid login calls Firebase with the trimmed email and the password', async () => {
    fillLogin('  alex@minigames.com ', 'Secret1!');

    submit('login');
    await flush();

    expect(authProvider.signInWithEmail).toHaveBeenCalledWith('alex@minigames.com', 'Secret1!');
  });

  it('while pending: every control is disabled, the button shows progress, the dialog cannot be dismissed', async () => {
    const request = deferred<AuthUser>();
    authProvider.signInWithEmail.mockReturnValue(request.promise);
    fillLogin();

    submit('login');

    const panel = query('#auth-panel-login');
    const controls = [...panel.querySelectorAll<HTMLInputElement | HTMLButtonElement>('input, button')];
    expect(controls.every((control) => control.disabled)).toBe(true);
    expect([...document.querySelectorAll<HTMLButtonElement>('.auth-dialog__tab')].every((tab) => tab.disabled)).toBe(true);
    expect(loginSubmit().textContent?.trim()).toBe('Logging in…');
    expect(panel.querySelector('form')?.getAttribute('aria-busy')).toBe('true');

    const dialogElement = query<HTMLDialogElement>('dialog.auth-dialog');
    const escape = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    const cancel = new Event('cancel', { cancelable: true });
    dialogElement.dispatchEvent(escape);
    dialogElement.dispatchEvent(cancel);
    expect(escape.defaultPrevented).toBe(true);
    expect(cancel.defaultPrevented).toBe(true);
    expect(dialogElement.getAttribute('closedby')).toBe('none');

    // a second submit (Enter again) does not send a second request
    submit('login');
    expect(authProvider.signInWithEmail).toHaveBeenCalledTimes(1);

    request.resolve(makeAuthUser());
    await flush();
    expect(dialogElement.hasAttribute('closedby')).toBe(false);
  });

  it('success: creates the app session, greets the user and closes the dialog', async () => {
    fillLogin();

    submit('login');
    await flush();

    expect(onAuthenticated).toHaveBeenCalledWith(makeAuthUser());
    expect(snackbar.success).toHaveBeenCalledWith('Welcome back, Alex Pro!');
    expect(dialog.isOpen).toBe(false);
    expect(onClose).toHaveBeenCalled();
  });

  it('failure: keeps the dialog open with the values, unlocks the form and explains why', async () => {
    authProvider.signInWithEmail.mockRejectedValue(new AuthError('invalid-credential'));
    fillLogin();

    submit('login');
    await flush();

    expect(dialog.isOpen).toBe(true);
    expect(onAuthenticated).not.toHaveBeenCalled();
    expect(snackbar.error).toHaveBeenCalledWith('Incorrect email or password.');
    expect(query<HTMLInputElement>('#login-email').disabled).toBe(false);
    expect(query<HTMLInputElement>('#login-email').value).toBe('alex@minigames.com');
    expect(loginSubmit().disabled).toBe(false);
    expect(loginSubmit().textContent?.trim()).toBe('Login');

    // the user can retry right away
    authProvider.signInWithEmail.mockResolvedValue(makeAuthUser());
    submit('login');
    await flush();
    expect(dialog.isOpen).toBe(false);
  });

  it('registration saves the username as displayName and greets with it', async () => {
    authProvider.signUpWithEmail.mockResolvedValue({
      user: makeAuthUser({ displayName: 'CozyGamer99', email: 'cozy@minigames.com' }),
      isDisplayNameSaved: true,
    });
    dialog.open('signup');
    type('#signup-username', 'CozyGamer99');
    type('#signup-email', 'cozy@minigames.com');
    type('#signup-password', 'Abc12!');
    type('#signup-confirmPassword', 'Abc12!');

    submit('signup');
    await flush();

    expect(authProvider.signUpWithEmail).toHaveBeenCalledWith('cozy@minigames.com', 'Abc12!', 'CozyGamer99');
    expect(snackbar.success).toHaveBeenCalledWith('Account created. Welcome, CozyGamer99!');
    expect(snackbar.warning).not.toHaveBeenCalled();
    expect(dialog.isOpen).toBe(false);
  });

  it('warns when the account was created but the username could not be saved', async () => {
    authProvider.signUpWithEmail.mockResolvedValue({ user: makeAuthUser(), isDisplayNameSaved: false });
    dialog.open('signup');
    type('#signup-username', 'CozyGamer99');
    type('#signup-email', 'cozy@minigames.com');
    type('#signup-password', 'Abc12!');
    type('#signup-confirmPassword', 'Abc12!');

    submit('signup');
    await flush();

    expect(snackbar.warning).toHaveBeenCalledTimes(1);
    expect(dialog.isOpen).toBe(false);
  });

  it('signs Firebase out again when the app cannot create its session', async () => {
    onAuthenticated.mockImplementation(() => {
      throw new Error('no email');
    });
    fillLogin();

    submit('login');
    await flush();

    expect(authProvider.signOut).toHaveBeenCalledTimes(1);
    expect(dialog.isOpen).toBe(true);
    expect(snackbar.error).toHaveBeenCalled();
  });

  it('a tab change requested by the URL while pending is applied after the request', async () => {
    const request = deferred<AuthUser>();
    authProvider.signInWithEmail.mockReturnValue(request.promise);
    fillLogin();
    submit('login');

    dialog.open('signup');
    expect(visiblePanelId()).toBe('auth-panel-login');

    request.reject(new AuthError('network'));
    await flush();
    expect(visiblePanelId()).toBe('auth-panel-signup');
  });

  it('"Forgot Password?" says that recovery is not available yet', () => {
    dialog.open('login');

    query<HTMLButtonElement>('.auth-form__forgot').click();

    expect(snackbar.info).toHaveBeenCalledWith('Password recovery is not available yet.');
  });
});

describe('AuthDialog — Google sign-in', () => {
  let dialog: AuthDialog;
  let authProvider: ReturnType<typeof createFakeAuthProvider>;
  let onAuthenticated: ReturnType<typeof vi.fn<(user: AuthUser) => AppSession>>;

  beforeEach(() => {
    authProvider = createFakeAuthProvider();
    onAuthenticated = vi.fn((user: AuthUser) => ({
      displayName: user.displayName ?? 'Player',
      email: user.email ?? '',
      authenticatedAt: 0,
    }));
    dialog = new AuthDialog({ authProvider, onAuthenticated });
    dialog.mount(document.body);
    vi.spyOn(snackbar, 'success');
    vi.spyOn(snackbar, 'error');
    vi.spyOn(snackbar, 'info');
  });

  afterEach(() => {
    dialog.destroy();
  });

  it('starts loading the SDK when the dialog opens, so the popup is not blocked later', () => {
    dialog.open('login');
    dialog.open('signup');

    expect(authProvider.preload).toHaveBeenCalledTimes(1);
  });

  it('works with an empty form: Google does not need the fields', async () => {
    dialog.open('login');

    googleButton().click();
    await flush();

    expect(authProvider.signInWithGoogle).toHaveBeenCalledTimes(1);
    expect(authProvider.signInWithEmail).not.toHaveBeenCalled();
  });

  it('while the Google window is open: everything is locked and the dialog cannot be dismissed', async () => {
    const request = deferred<AuthUser>();
    authProvider.signInWithGoogle.mockReturnValue(request.promise);
    dialog.open('login');

    googleButton().click();

    const controls = [...query('#auth-panel-login').querySelectorAll<HTMLInputElement | HTMLButtonElement>('input, button')];
    expect(controls.every((control) => control.disabled)).toBe(true);
    expect(googleButton().textContent?.trim()).toBe('Waiting for Google…');
    expect(googleButton().classList.contains('auth-form__google--pending')).toBe(true);
    expect(loginSubmit().classList.contains('auth-form__submit--pending')).toBe(false);

    const escape = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    query('dialog.auth-dialog').dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(true);

    // a second click cannot start a second popup
    googleButton().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(authProvider.signInWithGoogle).toHaveBeenCalledTimes(1);

    request.resolve(makeAuthUser());
    await flush();
  });

  it('success: the same app session as email/password, a greeting, the dialog closes', async () => {
    authProvider.signInWithGoogle.mockResolvedValue(
      makeAuthUser({ displayName: 'Alena P', photoUrl: 'https://lh3.googleusercontent.com/a/x' }),
    );
    dialog.open('signup');

    googleButton('signup').click();
    await flush();

    expect(onAuthenticated).toHaveBeenCalledWith(
      makeAuthUser({ displayName: 'Alena P', photoUrl: 'https://lh3.googleusercontent.com/a/x' }),
    );
    expect(snackbar.success).toHaveBeenCalledWith('Welcome, Alena P!');
    expect(dialog.isOpen).toBe(false);
  });

  it('a closed Google window: the dialog stays open, controls come back, an info (not error) Snackbar', async () => {
    authProvider.signInWithGoogle.mockRejectedValue(new AuthError('cancelled'));
    dialog.open('login');

    googleButton().click();
    await flush();

    expect(dialog.isOpen).toBe(true);
    expect(googleButton().disabled).toBe(false);
    expect(googleButton().textContent?.trim()).toBe('Continue with Google');
    expect(query<HTMLInputElement>('#login-email').disabled).toBe(false);
    expect(snackbar.info).toHaveBeenCalledWith('Google sign-in was cancelled.');
    expect(snackbar.error).not.toHaveBeenCalled();
    expect(onAuthenticated).not.toHaveBeenCalled();
  });

  it('a failure (popup blocked) explains what to do and keeps the dialog open', async () => {
    authProvider.signInWithGoogle.mockRejectedValue(new AuthError('popup-blocked'));
    dialog.open('login');

    googleButton().click();
    await flush();

    expect(dialog.isOpen).toBe(true);
    expect(snackbar.error).toHaveBeenCalledWith(
      'The Google sign-in window was blocked. Allow pop-ups for this site and try again.',
    );
  });

  it('cannot start Google while an email login is pending', async () => {
    const request = deferred<AuthUser>();
    authProvider.signInWithEmail.mockReturnValue(request.promise);
    dialog.open('login');
    type('#login-email', 'alex@minigames.com');
    type('#login-password', 'Secret1!');
    submit('login');

    googleButton().dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(authProvider.signInWithGoogle).not.toHaveBeenCalled();
    request.resolve(makeAuthUser());
    await flush();
  });
});
