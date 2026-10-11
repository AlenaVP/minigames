import { isRecord, isString } from '@shared/utils/type-guards';

export type AuthErrorKind =
  | 'invalid-credential'
  | 'email-in-use'
  | 'weak-password'
  | 'invalid-email'
  | 'too-many-requests'
  | 'network'
  | 'cancelled'
  | 'popup-blocked'
  | 'account-exists'
  | 'user-disabled'
  | 'configuration'
  | 'unknown';

const MESSAGES: Record<AuthErrorKind, string> = {
  'invalid-credential': 'Incorrect email or password.',
  'email-in-use': 'An account with this email already exists. Try logging in instead.',
  'weak-password': 'This password is too weak. Choose a stronger one.',
  'invalid-email': 'This email address is not valid.',
  'too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  network: 'No connection to the authentication server. Check your internet connection.',
  cancelled: 'Google sign-in was cancelled.',
  'popup-blocked': 'The Google sign-in window was blocked. Allow pop-ups for this site and try again.',
  'account-exists': 'This email is already registered with a password. Log in with your email and password.',
  'user-disabled': 'This account has been disabled.',
  configuration: 'Sign-in is not available right now. Please try again later.',
  unknown: 'Something went wrong while signing in. Please try again.',
};

/**
 * Firebase error code → kind. With Email Enumeration Protection (on by default in new projects) Firebase
 * answers a wrong email AND a wrong password with the same auth/invalid-credential — one message for both.
 */
const KIND_BY_CODE: Readonly<Record<string, AuthErrorKind>> = {
  'auth/invalid-credential': 'invalid-credential',
  'auth/invalid-login-credentials': 'invalid-credential',
  'auth/wrong-password': 'invalid-credential',
  'auth/user-not-found': 'invalid-credential',
  'auth/email-already-in-use': 'email-in-use',
  'auth/weak-password': 'weak-password',
  'auth/password-does-not-meet-requirements': 'weak-password',
  'auth/invalid-email': 'invalid-email',
  'auth/too-many-requests': 'too-many-requests',
  'auth/network-request-failed': 'network',
  'auth/popup-closed-by-user': 'cancelled',
  'auth/cancelled-popup-request': 'cancelled',
  'auth/user-cancelled': 'cancelled',
  'auth/popup-blocked': 'popup-blocked',
  'auth/account-exists-with-different-credential': 'account-exists',
  'auth/user-disabled': 'user-disabled',
  // The project is set up wrongly (provider off, domain not authorized, bad API key): not the user's fault
  'auth/operation-not-allowed': 'configuration',
  'auth/unauthorized-domain': 'configuration',
  'auth/invalid-api-key': 'configuration',
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'configuration',
};

export class AuthError extends Error {
  readonly kind: AuthErrorKind;
  /** The original Firebase code, e.g. "auth/unauthorized-domain" — for debugging, never shown to the user */
  readonly code: string | null;

  constructor(kind: AuthErrorKind, options: { code?: string | null; cause?: unknown } = {}) {
    super(MESSAGES[kind], { cause: options.cause });
    this.name = 'AuthError';
    this.kind = kind;
    this.code = options.code ?? null;
  }

  /** The user closed the Google window themselves: unlock the form quietly, no error toast */
  get isCancellation(): boolean {
    return this.kind === 'cancelled';
  }
}

/** Duck typing instead of `instanceof FirebaseError`: the Firebase SDK is loaded lazily and may not be imported yet */
function getFirebaseCode(error: unknown): string | null {
  return isRecord(error) && isString(error.code) && error.code.startsWith('auth/') ? error.code : null;
}

export function toAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) return error;

  const code = getFirebaseCode(error);
  const kind = code === null ? 'unknown' : (KIND_BY_CODE[code] ?? 'unknown');
  return new AuthError(kind, { code, cause: error });
}
