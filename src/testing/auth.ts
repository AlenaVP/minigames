import { vi } from 'vitest';
import type { AuthProvider } from '@app/services/auth';
import type { AuthUser } from '@shared/types/auth';

export function makeAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return { email: 'alex@minigames.com', displayName: 'Alex Pro', photoUrl: null, ...overrides };
}

/** An AuthProvider whose every method is a vi.fn — Firebase is never touched */
export function createFakeAuthProvider() {
  const user = makeAuthUser();
  return {
    signInWithEmail: vi.fn<AuthProvider['signInWithEmail']>(async () => user),
    signUpWithEmail: vi.fn<AuthProvider['signUpWithEmail']>(async () => ({ user, isDisplayNameSaved: true })),
    signInWithGoogle: vi.fn<AuthProvider['signInWithGoogle']>(async () => user),
    signOut: vi.fn<AuthProvider['signOut']>(async () => {}),
  } satisfies AuthProvider;
}
