import type { AuthUser, SignUpResult } from '@shared/types/auth';

/**
 * The identity provider behind an interface — the role of an InjectionToken in Angular:
 * the app depends on this contract, FirebaseAuthProvider implements it, tests use a fake.
 * Every method rejects with AuthError (never with a raw Firebase error).
 */
export interface AuthProvider {
  signInWithEmail(email: string, password: string): Promise<AuthUser>;
  signUpWithEmail(email: string, password: string, displayName: string): Promise<SignUpResult>;
  signInWithGoogle(): Promise<AuthUser>;
  signOut(): Promise<void>;
}
