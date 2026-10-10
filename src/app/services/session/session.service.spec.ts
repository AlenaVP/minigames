// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionChange } from '@shared/types/session';
import { createFakeAuthProvider, makeAuthUser } from '@testing/auth';
import { MemoryStorage } from '@testing/storage';
import { SessionService } from './session.service';

const KEY = 'minigames:test:app-session';
const TTL = 5 * 60 * 1000;
const START = Date.UTC(2026, 9, 10, 12, 0, 0);

const stored = (overrides: Record<string, unknown> = {}): string =>
  JSON.stringify({ displayName: 'Alex Pro', email: 'alex@minigames.com', authenticatedAt: START, ...overrides });

function storageEvent(newValue: string | null): StorageEvent {
  return new StorageEvent('storage', { key: KEY, newValue });
}

describe('SessionService', () => {
  let storage: MemoryStorage;
  let authProvider: ReturnType<typeof createFakeAuthProvider>;
  let changes: SessionChange[];

  function createService(): SessionService {
    const service = new SessionService({
      storage,
      authProvider,
      storageKey: KEY,
      ttlMs: TTL,
      clockSkewMs: 60_000,
      // The fake clock (vi.useFakeTimers) drives Date.now(), timers and the session check alike
      now: () => Date.now(),
    });
    service.onChange((change) => changes.push(change));
    return service;
  }

  const reasons = (): string[] => changes.map(({ reason }) => reason);

  beforeEach(() => {
    vi.useFakeTimers({ now: START });
    storage = new MemoryStorage();
    authProvider = createFakeAuthProvider();
    changes = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('start(): restoring after a reload', () => {
    it('restores a valid session without touching authenticatedAt or Firebase', () => {
      storage.setItem(KEY, stored());
      vi.setSystemTime(START + 60_000);

      const service = createService();
      service.start();

      expect(service.current?.authenticatedAt).toBe(START);
      expect(storage.getItem(KEY)).toBe(stored());
      expect(reasons()).toEqual(['current', 'restored']);
      expect(authProvider.signOut).not.toHaveBeenCalled();
    });

    it('starts as a guest when nothing is stored, without loading Firebase just to sign out', () => {
      const service = createService();
      service.start();

      expect(service.isAuthenticated).toBe(false);
      expect(authProvider.signOut).not.toHaveBeenCalled();
    });

    it.each([
      ['not JSON', 'oops{'],
      ['a missing field', JSON.stringify({ displayName: 'Alex', authenticatedAt: START })],
      ['a field of the wrong type', stored({ authenticatedAt: 'yesterday' })],
      ['a timestamp from the future', stored({ authenticatedAt: START + 10 * 60_000 })],
    ])('drops a record with %s: only our key is removed and Firebase is signed out', (_label, raw) => {
      storage.setItem(KEY, raw);
      storage.setItem('another-app:theme', 'dark');

      const service = createService();
      service.start();

      expect(service.isAuthenticated).toBe(false);
      expect(storage.getItem(KEY)).toBeNull();
      expect(storage.getItem('another-app:theme')).toBe('dark');
      expect(authProvider.signOut).toHaveBeenCalledTimes(1);
      expect(reasons()).toEqual(['current', 'invalid']);
    });

    it('ends a session that expired while the tab was closed and reports it once', () => {
      storage.setItem(KEY, stored());
      vi.setSystemTime(START + TTL);

      const service = createService();
      service.start();

      expect(service.isAuthenticated).toBe(false);
      expect(storage.getItem(KEY)).toBeNull();
      expect(authProvider.signOut).toHaveBeenCalledTimes(1);
      expect(reasons()).toEqual(['current', 'expired']);
    });
  });

  describe('signIn()', () => {
    it('stores exactly displayName, email and authenticatedAt (no avatar without a photo)', () => {
      const service = createService();

      service.signIn(makeAuthUser());

      expect(JSON.parse(storage.getItem(KEY) ?? '')).toEqual({
        displayName: 'Alex Pro',
        email: 'alex@minigames.com',
        authenticatedAt: START,
      });
      expect(reasons()).toEqual(['current', 'signed-in']);
      expect(changes.at(-1)?.session?.email).toBe('alex@minigames.com');
    });

    it('stores the Google photo as avatarUrl', () => {
      const service = createService();

      service.signIn(makeAuthUser({ photoUrl: 'https://lh3.googleusercontent.com/a/x' }));

      expect(JSON.parse(storage.getItem(KEY) ?? '').avatarUrl).toBe('https://lh3.googleusercontent.com/a/x');
    });

    it('keeps working in this tab when the storage refuses to write', () => {
      vi.spyOn(storage, 'setItem').mockImplementation(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      });
      const service = createService();

      service.signIn(makeAuthUser());

      expect(service.isAuthenticated).toBe(true);
    });
  });

  describe('expiration', () => {
    it('ensureActive() is true during the lifetime and ends the session once it is over', () => {
      const service = createService();
      service.signIn(makeAuthUser());

      vi.setSystemTime(START + TTL - 1);
      expect(service.ensureActive()).toBe(true);

      vi.setSystemTime(START + TTL);
      expect(service.ensureActive()).toBe(false);
      expect(storage.getItem(KEY)).toBeNull();
      expect(authProvider.signOut).toHaveBeenCalledTimes(1);

      // A second check does not produce a second expiration event (one Snackbar per expiration)
      expect(service.ensureActive()).toBe(false);
      expect(reasons()).toEqual(['current', 'signed-in', 'expired']);
    });

    it('switches to guest mode by itself at the expiry moment while the tab is open', () => {
      const service = createService();
      service.signIn(makeAuthUser());

      vi.advanceTimersByTime(TTL - 1);
      expect(service.isAuthenticated).toBe(true);

      vi.advanceTimersByTime(1);
      expect(service.isAuthenticated).toBe(false);
      expect(reasons().at(-1)).toBe('expired');
    });

    it('using the app does not extend the lifetime', () => {
      const service = createService();
      service.signIn(makeAuthUser());

      vi.advanceTimersByTime(TTL - 1000);
      expect(service.ensureActive()).toBe(true);
      expect(service.ensureActive()).toBe(true);

      vi.advanceTimersByTime(1000);
      expect(service.isAuthenticated).toBe(false);
    });

    it('a failed Firebase signOut does not bring the session back or throw', async () => {
      authProvider.signOut.mockRejectedValue(new Error('offline'));
      const service = createService();
      service.signIn(makeAuthUser());

      vi.setSystemTime(START + TTL);
      expect(service.ensureActive()).toBe(false);
      await vi.runAllTimersAsync();

      expect(service.isAuthenticated).toBe(false);
    });
  });

  describe('page becomes active again', () => {
    it('checks the session when the tab becomes visible (background timers may be throttled)', () => {
      const service = createService();
      service.start();
      service.signIn(makeAuthUser());

      // The clock moved on, but the timer has not run (a throttled background tab)
      vi.setSystemTime(START + TTL + 1000);
      document.dispatchEvent(new Event('visibilitychange'));

      expect(service.isAuthenticated).toBe(false);
      expect(reasons().at(-1)).toBe('expired');
    });

    it('checks the session when the page is restored from the back/forward cache', () => {
      const service = createService();
      service.start();
      service.signIn(makeAuthUser());

      vi.setSystemTime(START + TTL);
      globalThis.dispatchEvent(new Event('pageshow'));

      expect(service.isAuthenticated).toBe(false);
    });
  });

  describe('other tabs', () => {
    it('follows a logout in another tab without calling it an expiration', () => {
      const service = createService();
      service.start();
      service.signIn(makeAuthUser());

      storage.removeItem(KEY);
      globalThis.dispatchEvent(storageEvent(null));

      expect(service.isAuthenticated).toBe(false);
      expect(reasons().at(-1)).toBe('synced');
    });

    it('treats the other tab removing an expired session as an expiration here too', () => {
      const service = createService();
      service.start();
      service.signIn(makeAuthUser());

      vi.setSystemTime(START + TTL);
      storage.removeItem(KEY);
      globalThis.dispatchEvent(storageEvent(null));

      expect(reasons().at(-1)).toBe('expired');
    });

    it('adopts a sign-in made in another tab', () => {
      const service = createService();
      service.start();

      storage.setItem(KEY, stored());
      globalThis.dispatchEvent(storageEvent(stored()));

      expect(service.current?.email).toBe('alex@minigames.com');
      expect(reasons().at(-1)).toBe('synced');
    });

    it('ignores changes of other keys', () => {
      const service = createService();
      service.start();
      service.signIn(makeAuthUser());

      globalThis.dispatchEvent(new StorageEvent('storage', { key: 'another-app:theme', newValue: 'dark' }));

      expect(service.isAuthenticated).toBe(true);
    });
  });

  describe('logout()', () => {
    it('switches to guest mode at once and signs out of Firebase', async () => {
      const service = createService();
      service.signIn(makeAuthUser());

      await service.logout();

      expect(service.isAuthenticated).toBe(false);
      expect(storage.getItem(KEY)).toBeNull();
      expect(authProvider.signOut).toHaveBeenCalledTimes(1);
      expect(reasons().at(-1)).toBe('logged-out');
    });

    it('rejects when Firebase signOut fails, but the app session is already gone', async () => {
      authProvider.signOut.mockRejectedValue(new Error('offline'));
      const service = createService();
      service.signIn(makeAuthUser());

      await expect(service.logout()).rejects.toThrow('offline');
      expect(service.isAuthenticated).toBe(false);
    });

    it('cancels the expiry timer, so no late "expired" event follows a logout', async () => {
      const service = createService();
      service.signIn(makeAuthUser());
      await service.logout();

      vi.advanceTimersByTime(TTL);

      expect(reasons()).not.toContain('expired');
    });
  });

  describe('onChange()', () => {
    it('gives a new subscriber the current state at once and stops after the signal aborts', () => {
      const service = createService();
      service.signIn(makeAuthUser());
      const listener = vi.fn();
      const controller = new AbortController();

      service.onChange(listener, controller.signal);
      expect(listener).toHaveBeenCalledWith({ session: service.current, reason: 'current' });

      controller.abort();
      service.ensureActive();
      vi.setSystemTime(START + TTL);
      service.ensureActive();
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
