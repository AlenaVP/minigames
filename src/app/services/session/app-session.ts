import type { AuthUser } from '@shared/types/auth';
import type { AppSession } from '@shared/types/session';
import { hasShape, isNumber, isOptional, isString } from '@shared/utils/type-guards';

export type StoredSession = { status: 'none' } | { status: 'invalid' } | { status: 'valid'; session: AppSession };

const isNonEmptyString = (value: unknown): value is string => isString(value) && value.trim() !== '';
const isTimestamp = (value: unknown): value is number => isNumber(value) && Number.isSafeInteger(value) && value >= 0;

const isAppSession = hasShape<AppSession>({
  displayName: isNonEmptyString,
  email: isNonEmptyString,
  authenticatedAt: isTimestamp,
  avatarUrl: isOptional(isNonEmptyString),
});

/** The raw localStorage value → a session, "nothing stored" or "broken" (bad JSON, missing or mistyped fields) */
export function parseStoredSession(raw: string | null): StoredSession {
  if (raw === null) return { status: 'none' };

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { status: 'invalid' };
  }

  return isAppSession(value) ? { status: 'valid', session: value } : { status: 'invalid' };
}

export function getSessionExpiry(session: AppSession, ttlMs: number): number {
  return session.authenticatedAt + ttlMs;
}

export function isSessionExpired(session: AppSession, now: number, ttlMs: number): boolean {
  return now >= getSessionExpiry(session, ttlMs);
}

/** authenticatedAt "from the future" can only come from editing the storage by hand */
export function isFromTheFuture(session: AppSession, now: number, clockSkewMs: number): boolean {
  return session.authenticatedAt > now + clockSkewMs;
}

/** Only the documented fields, avatarUrl only when there is one */
export function serializeSession({ displayName, email, authenticatedAt, avatarUrl }: AppSession): string {
  return JSON.stringify(
    avatarUrl ? { displayName, email, authenticatedAt, avatarUrl } : { displayName, email, authenticatedAt },
  );
}

/** Google profiles may have no name: the email's local part, then a generic name */
export function resolveDisplayName(user: AuthUser): string {
  const name = user.displayName?.trim();
  if (name) return name;

  const localPart = user.email?.split('@', 1)[0]?.trim();
  return localPart || 'Player';
}

export function createAppSession(user: AuthUser, now: number): AppSession {
  const email = user.email?.trim();
  // Our providers (email/password, Google) always return an email; the API needs it as userEmail
  if (!email) throw new Error('The identity provider returned no email address');

  const avatarUrl = user.photoUrl?.trim();
  return {
    displayName: resolveDisplayName(user),
    email,
    authenticatedAt: now,
    ...(avatarUrl ? { avatarUrl } : {}),
  };
}
