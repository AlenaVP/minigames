// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthMode } from '@shared/types/auth';
import { createFakeSessionSource, makeAppSession, type FakeSessionSource } from '@testing/session';
import { BurgerMenu } from '.';

function query<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Nothing matches ${selector}`);
  return element;
}

const guestActions = (): HTMLElement => query('.burger-menu__actions--guest');
const userActions = (): HTMLElement => query('.burger-menu__actions--user');
const isOpen = (): boolean => query('.burger-menu').classList.contains('burger-menu--open');

describe('BurgerMenu', () => {
  let session: FakeSessionSource;
  let menu: BurgerMenu;
  let onAuthClick: ReturnType<typeof vi.fn<(mode: AuthMode) => void>>;
  let onLogout: ReturnType<typeof vi.fn<() => void>>;

  function mountMenu(): void {
    menu = new BurgerMenu({ session, onAuthClick, onLogout });
    menu.mount(document.body);
  }

  beforeEach(() => {
    session = createFakeSessionSource();
    onAuthClick = vi.fn<(mode: AuthMode) => void>();
    onLogout = vi.fn<() => void>();
  });

  afterEach(() => {
    menu.destroy();
    document.body.style.overflow = '';
  });

  it('shows Log In and Sign Up to a guest', () => {
    mountMenu();

    expect(guestActions().hidden).toBe(false);
    expect(userActions().hidden).toBe(true);
  });

  it('closes itself and opens Auth on the right tab', () => {
    mountMenu();
    menu.open();

    query('[data-auth="signup"]').click();

    expect(isOpen()).toBe(false);
    expect(onAuthClick).toHaveBeenCalledWith('signup');
  });

  it('shows the profile (avatar + name) and Log Out to a signed-in user', () => {
    session = createFakeSessionSource(makeAppSession({ displayName: 'John Doe' }));
    mountMenu();

    expect(guestActions().hidden).toBe(true);
    expect(userActions().hidden).toBe(false);
    expect(query('.burger-menu__user-name').textContent).toBe('John Doe');
    expect(query('.burger-menu__profile .user-avatar--accent').textContent).toBe('JD');
  });

  it('writes the name as text: markup in a display name is shown, not parsed', () => {
    mountMenu();

    session.emit(makeAppSession({ displayName: '<b>Bold</b>' }), 'signed-in');

    expect(query('.burger-menu__user-name').textContent).toBe('<b>Bold</b>');
    expect(document.querySelector('.burger-menu__profile b')).toBeNull();
  });

  it('closes itself and asks the app to log out', () => {
    session = createFakeSessionSource(makeAppSession());
    mountMenu();
    menu.open();

    query('.burger-menu__auth-btn--logout').click();

    expect(isOpen()).toBe(false);
    expect(onLogout).toHaveBeenCalledOnce();
    expect(onAuthClick).not.toHaveBeenCalled();
  });

  it('follows the session while open: an expiration brings the guest buttons back', () => {
    session = createFakeSessionSource(makeAppSession());
    mountMenu();
    menu.open();

    session.emit(null, 'expired');

    expect(guestActions().hidden).toBe(false);
    expect(userActions().hidden).toBe(true);
    expect(query('.burger-menu__user-name').textContent).toBe('');
  });

  it('stops following the session once destroyed', () => {
    mountMenu();

    menu.destroy();

    expect(session.listenerCount).toBe(0);
  });
});
