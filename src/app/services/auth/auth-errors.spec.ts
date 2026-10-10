import { describe, expect, it } from 'vitest';
import { AuthError, toAuthError } from './auth-errors';

/** What the Firebase SDK rejects with: a FirebaseError has a string `code` like "auth/…" */
const firebaseError = (code: string): Error => Object.assign(new Error(`Firebase: Error (${code}).`), { code });

describe('toAuthError', () => {
  it.each([
    ['auth/invalid-credential', 'invalid-credential'],
    ['auth/wrong-password', 'invalid-credential'],
    ['auth/user-not-found', 'invalid-credential'],
    ['auth/email-already-in-use', 'email-in-use'],
    ['auth/weak-password', 'weak-password'],
    ['auth/invalid-email', 'invalid-email'],
    ['auth/too-many-requests', 'too-many-requests'],
    ['auth/network-request-failed', 'network'],
    ['auth/popup-closed-by-user', 'cancelled'],
    ['auth/cancelled-popup-request', 'cancelled'],
    ['auth/popup-blocked', 'popup-blocked'],
    ['auth/account-exists-with-different-credential', 'account-exists'],
    ['auth/user-disabled', 'user-disabled'],
    ['auth/operation-not-allowed', 'configuration'],
    ['auth/unauthorized-domain', 'configuration'],
    ['auth/something-new', 'unknown'],
  ] as const)('%s → %s', (code, kind) => {
    const error = toAuthError(firebaseError(code));

    expect(error).toBeInstanceOf(AuthError);
    expect(error.kind).toBe(kind);
    expect(error.code).toBe(code);
  });

  it('gives one message for a wrong email and a wrong password (email enumeration protection)', () => {
    expect(toAuthError(firebaseError('auth/user-not-found')).message).toBe(
      toAuthError(firebaseError('auth/wrong-password')).message,
    );
  });

  it('keeps the original error as the cause and never shows the raw Firebase text', () => {
    const original = firebaseError('auth/invalid-credential');
    const error = toAuthError(original);

    expect(error.cause).toBe(original);
    expect(error.message).toBe('Incorrect email or password.');
  });

  it('treats anything that is not a Firebase auth error as unknown', () => {
    expect(toAuthError(new TypeError('boom')).kind).toBe('unknown');
    expect(toAuthError({ code: 'storage/unauthorized' }).kind).toBe('unknown');
    expect(toAuthError('oops').code).toBeNull();
  });

  it('passes an AuthError through unchanged', () => {
    const error = new AuthError('network');
    expect(toAuthError(error)).toBe(error);
  });
});

describe('AuthError.isCancellation', () => {
  it('is true only when the user closed the Google window', () => {
    expect(new AuthError('cancelled').isCancellation).toBe(true);
    expect(new AuthError('popup-blocked').isCancellation).toBe(false);
  });
});
