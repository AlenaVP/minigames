export type AuthMode = 'login' | 'signup';

/** The identity Firebase confirms — only what the app needs, no Firebase types leak out of services/auth */
export interface AuthUser {
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
}

export interface SignUpResult {
  user: AuthUser;
  /** The account exists, but saving the username as displayName failed (the app still knows the name) */
  isDisplayNameSaved: boolean;
}
