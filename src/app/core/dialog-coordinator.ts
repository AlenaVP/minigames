import type { AuthMode } from '@shared/types/auth';
import { snackbar } from '@shared/ui/snackbar';
import type { NavigateOptions, RouteSnapshot } from './router';
import { DIALOG_QUERY, parseAuthQueryValue, toAuthQueryValue } from './router/dialog-query';
import type { QueryPatch } from './router/url';

export const ALREADY_SIGNED_IN_MESSAGE = "You're already signed in.";

/** The part of the Router the dialogs need (the real Router fits; tests pass a fake) */
export interface DialogRouter {
  readonly snapshot: RouteSnapshot | null;
  readonly isDialogEntry: boolean;
  updateQuery(patch: QueryPatch, options?: NavigateOptions): void;
  back(): void;
}

export interface AuthDialogControl {
  readonly isOpen: boolean;
  open(mode: AuthMode): void;
  close(): void;
}

export interface GameDetailsControl {
  open(slug: string): void;
  suspend(slug: string): void;
  close(): void;
}

export interface SessionGuard {
  /** true = a valid app session; an expired one is ended right there (its own single toast) */
  ensureActive(): boolean;
}

export interface DialogCoordinatorOptions {
  router: DialogRouter;
  authDialog: AuthDialogControl;
  gameDetails: GameDetailsControl;
  session: SessionGuard;
}

/**
 * URL ⇄ dialogs. Nothing opens a dialog directly: actions change the URL, and sync() makes the dialogs match it —
 * the same path for a click, a deep link and Back/Forward (Angular: a component driven by queryParamMap).
 *
 *   ?game=x            Game Details
 *   ?auth=login        Auth (a guest only: a signed-in user gets the URL cleaned and a toast — RSS-QS-4-3-4)
 *   ?game=x&auth=…     Auth, with Game Details suspended underneath; closing Auth brings the game back
 */
export class DialogCoordinator {
  private readonly options: DialogCoordinatorOptions;

  constructor(options: DialogCoordinatorOptions) {
    this.options = options;
  }

  /** A new history entry: Back closes the dialog */
  openGameDetails(slug: string): void {
    this.options.router.updateQuery({ [DIALOG_QUERY.game]: slug, [DIALOG_QUERY.auth]: null }, { dialog: true });
  }

  /**
   * Log In / Sign Up, or a guest's protected action inside Game Details: Auth on top, an open game stays in the URL.
   * Guarded here too, so a signed-in user does not even get a history entry that would be removed at once.
   */
  openAuth(mode: AuthMode): void {
    if (this.options.session.ensureActive()) {
      snackbar.info(ALREADY_SIGNED_IN_MESSAGE);
      return;
    }
    this.options.router.updateQuery({ [DIALOG_QUERY.auth]: toAuthQueryValue(mode) }, { dialog: true });
  }

  /** The user switched the Login/Register tab: the same dialog, so the same history entry */
  switchAuthMode(mode: AuthMode): void {
    this.options.router.updateQuery({ [DIALOG_QUERY.auth]: toAuthQueryValue(mode) }, { replace: true });
  }

  /**
   * A dialog was closed (✕, backdrop, Esc, after sign-in). If the URL still names it:
   * - we pushed that entry ourselves → Back, so the history has no "dialog closed" step;
   * - opened from a deep link (nothing of ours to go back to) → remove the key in place.
   * When the URL itself closed the dialog (Back), the key is already gone and nothing happens.
   */
  handleDialogClosed(key: string): void {
    const { router } = this.options;
    if (!router.snapshot?.query.has(key)) return;
    if (router.isDialogEntry) router.back();
    else router.updateQuery({ [key]: null }, { replace: true });
  }

  /** URL → dialogs. Idempotent: called on every navigation and when another tab signs in */
  sync({ query }: RouteSnapshot): void {
    const { router, authDialog, gameDetails, session } = this.options;
    const slug = query.get(DIALOG_QUERY.game);
    const auth = parseAuthQueryValue(query.get(DIALOG_QUERY.auth));

    // The router has already run the session check (beforeNavigate): an expired or invalid session is a guest by now
    if (auth && session.ensureActive()) {
      router.updateQuery({ [DIALOG_QUERY.auth]: null }, { replace: true });
      snackbar.info(ALREADY_SIGNED_IN_MESSAGE);
      return;
    }

    if (auth && !auth.isValid) {
      router.updateQuery({ [DIALOG_QUERY.auth]: toAuthQueryValue(auth.mode) }, { replace: true });
      return;
    }

    // Auth leaves first, so Game Details coming back gets the focus and is not stacked over it for a moment
    if (!auth && authDialog.isOpen) authDialog.close();

    if (!slug) gameDetails.close();
    else if (auth) gameDetails.suspend(slug);
    else gameDetails.open(slug);

    if (auth) authDialog.open(auth.mode);
  }
}
