/** Exactly what is stored under SESSION_STORAGE_KEY — no passwords, no Firebase tokens */
export interface AppSession {
  displayName: string;
  email: string;
  /** Date.now() at successful authentication */
  authenticatedAt: number;
  /** Only when the provider gave a photo (Google) */
  avatarUrl?: string;
}

export type SessionChangeReason =
  /** The state at the moment of subscribing (BehaviorSubject-style first emission) */
  | 'current'
  | 'restored'
  | 'signed-in'
  | 'logged-out'
  | 'expired'
  | 'invalid'
  /** Another tab signed in or out */
  | 'synced';

export interface SessionChange {
  session: AppSession | null;
  reason: SessionChangeReason;
}

export type SessionListener = (change: SessionChange) => void;

/**
 * The read-only side of the session that widgets follow (header, burger menu).
 * Angular analogue: injecting a facade that exposes only the state stream, not signIn()/logout().
 * Widgets depend on this contract, so a test can hand them a tiny fake instead of a real SessionService.
 */
export interface SessionSource {
  /** Calls the listener at once with the current state, then on every change; unsubscribes when `signal` aborts */
  onChange(listener: SessionListener, signal?: AbortSignal): () => void;
}
