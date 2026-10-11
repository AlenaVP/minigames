import { vi } from 'vitest';
import type { AppSession, SessionAccess, SessionChangeReason, SessionListener } from '@shared/types/session';

export function makeAppSession(overrides: Partial<AppSession> = {}): AppSession {
  return { displayName: 'John Doe', email: 'john@minigames.com', authenticatedAt: 0, ...overrides };
}

export interface FakeSessionSource extends SessionAccess {
  /** Plays the part of sign-in, logout, expiration, another tab */
  emit(session: AppSession | null, reason: SessionChangeReason): void;
  /** The session has run out, but nothing has noticed yet: the next ensureActive() ends it (event 'expired') */
  expireSilently(): void;
  readonly listenerCount: number;
  readonly ensureActive: ReturnType<typeof vi.fn<() => boolean>>;
}

/** A SessionSource the test drives by hand */
export function createFakeSessionSource(initial: AppSession | null = null): FakeSessionSource {
  let current = initial;
  let isExpired = false;
  const listeners = new Set<SessionListener>();

  const emit = (session: AppSession | null, reason: SessionChangeReason): void => {
    current = session;
    for (const listener of listeners) listener({ session, reason });
  };

  return {
    get current(): AppSession | null {
      return current;
    },
    onChange(listener: SessionListener, signal?: AbortSignal): () => void {
      listeners.add(listener);
      const unsubscribe = (): void => {
        listeners.delete(listener);
      };
      signal?.addEventListener('abort', unsubscribe, { once: true });
      listener({ session: current, reason: 'current' });
      return unsubscribe;
    },
    emit,
    expireSilently(): void {
      isExpired = true;
    },
    ensureActive: vi.fn((): boolean => {
      if (current !== null && isExpired) {
        isExpired = false;
        emit(null, 'expired');
      }
      return current !== null;
    }),
    get listenerCount(): number {
      return listeners.size;
    },
  };
}
