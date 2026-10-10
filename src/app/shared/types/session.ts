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
