import { Header } from '@widgets/header';
import { Footer } from '@widgets/footer';
import { BurgerMenu } from '@widgets/burger-menu';
import { AuthDialog } from '@dialogs/auth-dialog';
import { GameDetailsDialog } from '@dialogs/game-details-dialog';
import { HomePage } from '@app/pages/home/home.page';
import { LibraryPage } from '@app/pages/library/library.page';
import { NotFoundPage } from '@app/pages/not-found/not-found.page';
import { toLibraryQuery } from '@app/pages/library/library-query';
import type { AuthMode } from '@shared/types/auth';
import { snackbar } from '@shared/ui/snackbar';
import { sessionService } from '@app/services/session';
import { authProvider } from '@app/services/auth';
import { Router, type RouteSnapshot } from './router';
import { DIALOG_QUERY, parseAuthQueryValue, toAuthQueryValue } from './router/dialog-query';

const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.';

/**
 * The conductor: builds the layout, wires components to the router and keeps the dialogs in sync with the URL.
 * Nothing here opens a dialog directly — it changes the URL, and syncDialogs() reacts.
 */
export function bootstrapApp(): void {
  const root = document.createElement('div');
  root.id = 'app';
  document.body.append(root);

  /** Opening = a NEW history entry (Back closes the dialog); only one dialog at a time */
  const openGameDetails = (slug: string): void =>
    router.updateQuery({ [DIALOG_QUERY.game]: slug, [DIALOG_QUERY.auth]: null }, { dialog: true });

  const openAuth = (mode: AuthMode): void =>
    router.updateQuery({ [DIALOG_QUERY.auth]: toAuthQueryValue(mode), [DIALOG_QUERY.game]: null }, { dialog: true });

  /**
   * The dialog was closed by the user (✕, backdrop, Esc). If the URL still names it:
   * - we pushed that entry ourselves → Back, so the history has no "dialog closed" step;
   * - opened from a deep link (nothing of ours to go back to) → remove the key in place.
   * When the URL itself closed the dialog (Back), the key is already gone and nothing happens.
   */
  const handleDialogClosed = (key: string): void => {
    if (!router.snapshot?.query.has(key)) return;
    if (router.isDialogEntry) router.back();
    else router.updateQuery({ [key]: null }, { replace: true });
  };

  const authDialog = new AuthDialog({
    authProvider,
    onAuthenticated: (user) => sessionService.signIn(user),
    onClose: () => handleDialogClosed(DIALOG_QUERY.auth),
    onModeChange: (mode) => router.updateQuery({ [DIALOG_QUERY.auth]: toAuthQueryValue(mode) }, { replace: true }),
  });
  const gameDetailsDialog = new GameDetailsDialog({ onClose: () => handleDialogClosed(DIALOG_QUERY.game) });

  const burgerMenu = new BurgerMenu({ onAuthClick: openAuth });

  const header = new Header({
    onBurgerClick: () => burgerMenu.open(),
    onAuthClick: openAuth,
  });
  header.mount(root);

  const pageOutlet = document.createElement('main');
  pageOutlet.classList.add('page-outlet');
  root.append(pageOutlet);

  new Footer().mount(root);
  burgerMenu.mount(document.body);
  authDialog.mount(document.body);
  gameDetailsDialog.mount(document.body);
  snackbar.mount(document.body);

  const router = new Router(pageOutlet, {
    home: () => new HomePage({ onGameDetails: openGameDetails }),
    library: ({ query }) =>
      new LibraryPage({
        initialQuery: query,
        onGameDetails: openGameDetails,
        onNavigate: (state, { replace }) => router.updateQuery(toLibraryQuery(state), { replace }),
      }),
    'not-found': () => new NotFoundPage(),
  });

  /** URL → dialogs. Idempotent: called on every navigation, opens/switches/closes only what differs */
  const syncDialogs = ({ query }: RouteSnapshot): void => {
    const slug = query.get(DIALOG_QUERY.game);
    const auth = parseAuthQueryValue(query.get(DIALOG_QUERY.auth));

    if (slug && auth) {
      router.updateQuery({ [DIALOG_QUERY.auth]: null }, { replace: true });
      return;
    }

    if (auth && !auth.isValid) {
      router.updateQuery({ [DIALOG_QUERY.auth]: toAuthQueryValue(auth.mode) }, { replace: true });
      return;
    }

    if (slug) gameDetailsDialog.open(slug);
    else if (gameDetailsDialog.isOpen) gameDetailsDialog.close();

    if (auth) authDialog.open(auth.mode);
    else if (authDialog.isOpen) authDialog.close();
  };

  // One toast per expiration event — whatever noticed it first (timer, tab return, navigation, protected action)
  sessionService.onChange(({ reason }) => {
    if (reason === 'expired') snackbar.warning(SESSION_EXPIRED_MESSAGE);
  });
  sessionService.start();
  router.beforeNavigate(() => sessionService.ensureActive());

  router.onChange((snapshot) => {
    header.setActiveRoute(snapshot.route);
    burgerMenu.setActiveRoute(snapshot.route);
    syncDialogs(snapshot);
  });

  router.start();
}
