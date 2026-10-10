import { FIREBASE_CONFIG } from '@app/core/constants/firebase';
import type { AuthProvider } from './auth-provider';
import { FirebaseAuthProvider } from './firebase-auth.provider';

export type { AuthProvider } from './auth-provider';
export { AuthError, type AuthErrorKind, toAuthError } from './auth-errors';
export { FirebaseAuthProvider } from './firebase-auth.provider';

/** App-wide singleton (providedIn: 'root'); typed as the interface so callers never depend on Firebase */
export const authProvider: AuthProvider = new FirebaseAuthProvider(FIREBASE_CONFIG);
