import type { AuthMode } from '@shared/types/auth';

/** Query keys of the dialogs: they work on top of any page (/library?…&game=tiny-glade, /?auth=login) */
export const DIALOG_QUERY = { game: 'game', auth: 'auth' } as const;

/** The URL says "register" (as in the task), the app calls the mode 'signup' */
const AUTH_QUERY_VALUE: Record<AuthMode, string> = { login: 'login', signup: 'register' };

export function toAuthQueryValue(mode: AuthMode): string {
  return AUTH_QUERY_VALUE[mode];
}

/** null = no auth dialog; an unknown value still opens the dialog, on its default tab */
export function parseAuthQueryValue(value: string | null): { mode: AuthMode; isValid: boolean } | null {
  if (value === null) return null;
  if (value === AUTH_QUERY_VALUE.signup) return { mode: 'signup', isValid: true };
  return { mode: 'login', isValid: value === AUTH_QUERY_VALUE.login };
}
