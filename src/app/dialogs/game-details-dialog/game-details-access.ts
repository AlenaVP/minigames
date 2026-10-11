import type { SessionAccess } from '@shared/types/session';

/**
 * What Game Details needs from the rest of the app (Angular: services injected into the dialog):
 * who is signed in, and a way to ask for sign-in without knowing about the router or the Auth dialog.
 */
export interface GameDetailsAccess {
  session: SessionAccess;
  /** A guest's protected action: Auth opens over this game (?game=x&auth=login) and the game waits underneath */
  requestAuth: () => void;
}
