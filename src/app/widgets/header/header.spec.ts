// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthMode } from '@shared/types/auth';
import { createFakeSessionSource, makeAppSession, type FakeSessionSource } from '@testing/session';
import { Header } from '.';

function query<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Nothing matches ${selector}`);
  return element;
}

const guestActions = (): HTMLElement => query('.header__actions--guest');
const userActions = (): HTMLElement => query('.header__actions--user');
const logOutButton = (): HTMLButtonElement => query('.header__auth-btn--logout');

describe('Header', () => {
  let session: FakeSessionSource;
  let header: Header;
  let onAuthClick: ReturnType<typeof vi.fn<(mode: AuthMode) => void>>;
  let onLogout: ReturnType<typeof vi.fn<() => void>>;

  function mountHeader(): void {
    header = new Header({ session, onBurgerClick: vi.fn(), onAuthClick, onLogout });
    header.mount(document.body);
  }

  beforeEach(() => {
    session = createFakeSessionSource();
    onAuthClick = vi.fn<(mode: AuthMode) => void>();
    onLogout = vi.fn<() => void>();
  });

  afterEach(() => {
    header.destroy();
  });

  it('shows the guest controls to a guest', () => {
    mountHeader();

    expect(guestActions().hidden).toBe(false);
    expect(userActions().hidden).toBe(true);
  });

  it('opens Auth on the right tab from Log In and Sign Up', () => {
    mountHeader();

    query('[data-auth="login"]').click();
    query('[data-auth="signup"]').click();

    expect(onAuthClick.mock.calls).toEqual([['login'], ['signup']]);
  });

  it('starts in the signed-in state when a session is already active (restored after a reload)', () => {
    session = createFakeSessionSource(makeAppSession({ displayName: 'John Doe' }));
    mountHeader();

    expect(guestActions().hidden).toBe(true);
    expect(userActions().hidden).toBe(false);
    expect(query('.header__user-name').textContent).toBe('John Doe');
    expect(query('.header__profile .user-avatar').textContent).toBe('JD');
  });

  it('replaces the guest controls with the profile and Log Out after sign-in', () => {
    mountHeader();

    session.emit(makeAppSession({ displayName: 'Alena Pavlova' }), 'signed-in');

    expect(guestActions().hidden).toBe(true);
    expect(userActions().hidden).toBe(false);
    expect(query('.header__profile').textContent?.replaceAll(/\s+/g, ' ').trim()).toBe('Signed in as Alena Pavlova AP');
  });

  it('writes the name as text: markup in a display name is shown, not parsed', () => {
    mountHeader();

    session.emit(makeAppSession({ displayName: '<img src=x onerror=alert(1)>' }), 'signed-in');

    expect(query('.header__user-name').textContent).toBe('<img src=x onerror=alert(1)>');
    expect(document.querySelector('.header__profile img')).toBeNull();
  });

  it('keeps the whole name in a tooltip, since a long one is cut with an ellipsis', () => {
    mountHeader();

    session.emit(makeAppSession({ displayName: 'Maximilian Alexander von Habsburg' }), 'signed-in');

    expect(query('.header__user-name').title).toBe('Maximilian Alexander von Habsburg');
  });

  it('shows the photo when the session has one', () => {
    mountHeader();

    session.emit(makeAppSession({ avatarUrl: 'https://lh3.googleusercontent.com/a/john.jpg' }), 'signed-in');

    expect(query<HTMLImageElement>('.header__profile img').getAttribute('src')).toBe(
      'https://lh3.googleusercontent.com/a/john.jpg',
    );
  });

  it('asks the app to log out', () => {
    session = createFakeSessionSource(makeAppSession());
    mountHeader();

    logOutButton().click();

    expect(onLogout).toHaveBeenCalledOnce();
  });

  it('goes back to the guest controls when the session ends (logout, expiration, another tab)', () => {
    session = createFakeSessionSource(makeAppSession());
    mountHeader();

    session.emit(null, 'expired');

    expect(guestActions().hidden).toBe(false);
    expect(userActions().hidden).toBe(true);
    expect(query('.header__user-name').textContent).toBe('');
  });

  it('moves the focus from Log Out to Log In, not to <body>', () => {
    session = createFakeSessionSource(makeAppSession());
    mountHeader();
    logOutButton().focus();

    session.emit(null, 'logged-out');

    expect(document.activeElement).toBe(query('[data-auth="login"]'));
  });

  it('moves the focus to Sign Up where Log In is not shown (tablet)', () => {
    session = createFakeSessionSource(makeAppSession());
    mountHeader();
    query('[data-auth="login"]').style.display = 'none';
    logOutButton().focus();

    session.emit(null, 'logged-out');

    expect(document.activeElement).toBe(query('[data-auth="signup"]'));
  });

  it('leaves the focus alone when it was somewhere else', () => {
    session = createFakeSessionSource(makeAppSession());
    mountHeader();
    const elsewhere = document.createElement('button');
    document.body.append(elsewhere);
    elsewhere.focus();

    session.emit(null, 'expired');

    expect(document.activeElement).toBe(elsewhere);
    elsewhere.remove();
  });

  it('stops following the session once destroyed', () => {
    mountHeader();
    expect(session.listenerCount).toBe(1);

    header.destroy();

    expect(session.listenerCount).toBe(0);
  });
});
