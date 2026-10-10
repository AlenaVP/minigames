import type { AuthProvider } from '@app/services/auth';
import type { AuthUser } from '@shared/types/auth';
import type { AppSession, SessionChange, SessionChangeReason } from '@shared/types/session';
import {
  createAppSession,
  getSessionExpiry,
  isFromTheFuture,
  isSessionExpired,
  parseStoredSession,
  serializeSession,
} from './app-session';

type SessionListener = (change: SessionChange) => void;

export interface SessionServiceOptions {
  storage: Storage;
  authProvider: AuthProvider;
  storageKey: string;
  ttlMs: number;
  clockSkewMs: number;
  now?: () => number;
}

/**
 * The app session — the source of truth for "is the user signed in" (Firebase only confirms identity).
 * Angular analogue: an @Injectable AuthState service with a BehaviorSubject.
 *
 *   start()          on startup: restore a valid session, drop an expired/broken one
 *   signIn(user)     after Firebase succeeded: store { displayName, email, authenticatedAt, avatarUrl? }
 *   ensureActive()   before navigation and before every protected action: false = guest (expired → ended here)
 *   logout()         the user's choice
 *
 * Every end of a session removes ONLY our key and calls Firebase signOut,
 * so Firebase's own persistence can never bring the user back.
 */
export class SessionService {
  private readonly options: Required<SessionServiceOptions>;
  private readonly listeners = new Set<SessionListener>();
  private session: AppSession | null = null;
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: SessionServiceOptions) {
    this.options = { now: Date.now, ...options };
  }

  get current(): AppSession | null {
    return this.session;
  }

  get isAuthenticated(): boolean {
    return this.session !== null;
  }

  /** Like a BehaviorSubject: the listener immediately gets the current state (reason 'current') */
  onChange(listener: SessionListener, signal?: AbortSignal): () => void {
    this.listeners.add(listener);
    const unsubscribe = (): void => {
      this.listeners.delete(listener);
    };
    signal?.addEventListener('abort', unsubscribe, { once: true });

    listener({ session: this.session, reason: 'current' });
    return unsubscribe;
  }

  /** Startup check + the "page became active again" checks (tab switch, bfcache) + other tabs */
  start(target: Window = globalThis.window): void {
    this.restore();

    target.document.addEventListener('visibilitychange', () => {
      if (target.document.visibilityState === 'visible') this.ensureActive();
    });
    target.addEventListener('pageshow', () => this.ensureActive());
    target.addEventListener('storage', (event) => {
      if (event.key === this.options.storageKey || event.key === null) this.syncFromStorage();
    });
  }

  signIn(user: AuthUser): AppSession {
    const session = createAppSession(user, this.options.now());
    this.write(session);
    this.setSession(session, 'signed-in');
    return session;
  }

  /** true = signed in and not expired. An expired session is ended right here (key removed, signOut, one event) */
  ensureActive(): boolean {
    if (!this.session) return false;
    if (!isSessionExpired(this.session, this.options.now(), this.options.ttlMs)) return true;

    this.end('expired');
    return false;
  }

  /** Guest mode at once; resolves when Firebase signOut finished, rejects if it failed (the UI can tell the user) */
  async logout(): Promise<void> {
    if (!this.session) return this.options.authProvider.signOut();
    this.removeStoredSession();
    this.setSession(null, 'logged-out');
    return this.options.authProvider.signOut();
  }

  private restore(): void {
    const stored = parseStoredSession(this.read());
    if (stored.status === 'none') return;

    const now = this.options.now();
    if (stored.status === 'invalid' || isFromTheFuture(stored.session, now, this.options.clockSkewMs)) {
      this.endStored('invalid');
      return;
    }

    if (isSessionExpired(stored.session, now, this.options.ttlMs)) {
      this.endStored('expired');
      return;
    }

    // authenticatedAt is kept as is: a reload does not extend the lifetime
    this.setSession(stored.session, 'restored');
  }

  /** Another tab wrote or removed our key */
  private syncFromStorage(): void {
    const stored = parseStoredSession(this.read());
    const now = this.options.now();

    if (stored.status === 'valid' && !isSessionExpired(stored.session, now, this.options.ttlMs)) {
      this.setSession(stored.session, 'synced');
      return;
    }

    if (!this.session) return;
    // If our copy has run out by now, the other tab simply expired first: still an expiration for this tab
    const reason = isSessionExpired(this.session, now, this.options.ttlMs) ? 'expired' : 'synced';
    this.setSession(null, reason);
  }

  private end(reason: SessionChangeReason): void {
    this.removeStoredSession();
    this.setSession(null, reason);
    this.signOutQuietly();
  }

  /** A broken or expired record found at startup: there is no in-memory session yet */
  private endStored(reason: SessionChangeReason): void {
    this.removeStoredSession();
    this.signOutQuietly();
    this.notify({ session: null, reason });
  }

  private setSession(session: AppSession | null, reason: SessionChangeReason): void {
    this.session = session;
    this.scheduleExpiry();
    this.notify({ session, reason });
  }

  /** Fires exactly at the expiry moment while the tab is open (background tabs: visibilitychange catches up) */
  private scheduleExpiry(): void {
    if (this.expiryTimer !== null) clearTimeout(this.expiryTimer);
    this.expiryTimer = null;
    if (!this.session) return;

    const delay = Math.max(0, getSessionExpiry(this.session, this.options.ttlMs) - this.options.now());
    this.expiryTimer = setTimeout(() => this.ensureActive(), delay);
  }

  private notify(change: SessionChange): void {
    for (const listener of this.listeners) listener(change);
  }

  /** The session is already over for the app; a failed Firebase signOut must not bring it back or crash */
  private signOutQuietly(): void {
    this.options.authProvider.signOut().catch(() => {});
  }

  // Storage can throw (disabled storage, private mode quota): the app keeps working, the session is then per-tab

  private read(): string | null {
    try {
      return this.options.storage.getItem(this.options.storageKey);
    } catch {
      return null;
    }
  }

  private write(session: AppSession): void {
    try {
      this.options.storage.setItem(this.options.storageKey, serializeSession(session));
    } catch {
      // see above
    }
  }

  private removeStoredSession(): void {
    try {
      this.options.storage.removeItem(this.options.storageKey);
    } catch {
      // see above
    }
  }
}
