import type { AppSession, SessionChangeReason, SessionListener, SessionSource } from '@shared/types/session';

export function makeAppSession(overrides: Partial<AppSession> = {}): AppSession {
  return { displayName: 'John Doe', email: 'john@minigames.com', authenticatedAt: 0, ...overrides };
}

export interface FakeSessionSource extends SessionSource {
  /** Plays the part of sign-in, logout, expiration, another tab */
  emit(session: AppSession | null, reason: SessionChangeReason): void;
  readonly listenerCount: number;
}

/** A SessionSource the test drives by hand */
export function createFakeSessionSource(initial: AppSession | null = null): FakeSessionSource {
  let current = initial;
  const listeners = new Set<SessionListener>();

  return {
    onChange(listener: SessionListener, signal?: AbortSignal): () => void {
      listeners.add(listener);
      const unsubscribe = (): void => {
        listeners.delete(listener);
      };
      signal?.addEventListener('abort', unsubscribe, { once: true });
      listener({ session: current, reason: 'current' });
      return unsubscribe;
    },
    emit(session: AppSession | null, reason: SessionChangeReason): void {
      current = session;
      for (const listener of listeners) listener({ session, reason });
    },
    get listenerCount(): number {
      return listeners.size;
    },
  };
}
