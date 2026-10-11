import { Header } from '@widgets/header';
import { Footer } from '@widgets/footer';
import { BurgerMenu } from '@widgets/burger-menu';
import { AuthDialog } from '@dialogs/auth-dialog';
import { GameDetailsDialog } from '@dialogs/game-details-dialog';
import { HomePage } from '@app/pages/home/home.page';
import { LibraryPage } from '@app/pages/library/library.page';
import { NotFoundPage } from '@app/pages/not-found/not-found.page';
import { toLibraryQuery } from '@app/pages/library/library-query';
import { snackbar } from '@shared/ui/snackbar';
import { sessionService } from '@app/services/session';
import { authProvider } from '@app/services/auth';
import { DialogCoordinator } from './dialog-coordinator';
import { Router } from './router';
import { DIALOG_QUERY } from './router/dialog-query';

const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.';
const LOGGED_OUT_MESSAGE = "You've logged out.";
const SIGN_OUT_FAILED_MESSAGE =
  "You're logged out, but signing out of your account didn't finish. Please check your connection.";

/**
 * The conductor: builds the layout, wires components to the router and keeps the dialogs in sync with the URL.
 * Nothing here opens a dialog directly — it changes the URL, and syncDialogs() reacts.
 */
export function bootstrapApp(): void {
  const root = document.createElement('div');
  root.id = 'app';
  document.body.append(root);

  const authDialog = new AuthDialog({
    authProvider,
    onAuthenticated: (user) => sessionService.signIn(user),
    onClose: () => dialogs.handleDialogClosed(DIALOG_QUERY.auth),
    onModeChange: (mode) => dialogs.switchAuthMode(mode),
  });
  const gameDetailsDialog = new GameDetailsDialog({ onClose: () => dialogs.handleDialogClosed(DIALOG_QUERY.game) });

  /**
   * Log Out in the header or the menu (RSS-QS-4-3-3). The UI is in Guest Mode the moment logout() returns;
   * Firebase signOut finishes after that, and its failure is reported but never restores the user.
   */
  const logOut = (): void => {
    // The session ran out a moment ago and the timer has not fired yet: that is the event, with its own single toast
    if (!sessionService.ensureActive()) return;

    sessionService.logout().then(
      () => snackbar.success(LOGGED_OUT_MESSAGE),
      () => snackbar.error(SIGN_OUT_FAILED_MESSAGE),
    );
  };

  const burgerMenu = new BurgerMenu({
    session: sessionService,
    onAuthClick: (mode) => dialogs.openAuth(mode),
    onLogout: logOut,
  });

  const header = new Header({
    session: sessionService,
    onBurgerClick: () => burgerMenu.open(),
    onAuthClick: (mode) => dialogs.openAuth(mode),
    onLogout: logOut,
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
    home: () => new HomePage({ onGameDetails: (slug) => dialogs.openGameDetails(slug) }),
    library: ({ query }) =>
      new LibraryPage({
        initialQuery: query,
        onGameDetails: (slug) => dialogs.openGameDetails(slug),
        onNavigate: (state, { replace }) => router.updateQuery(toLibraryQuery(state), { replace }),
      }),
    'not-found': () => new NotFoundPage(),
  });

  const dialogs = new DialogCoordinator({
    router,
    authDialog,
    gameDetails: gameDetailsDialog,
    session: sessionService,
  });

  // One toast per expiration event — whatever noticed it first (timer, tab return, navigation, protected action)
  sessionService.onChange(({ reason }) => {
    if (reason === 'expired') snackbar.warning(SESSION_EXPIRED_MESSAGE);
    // Another tab signed in while this one shows Auth: the guard applies here too
    if (reason === 'synced' && router.snapshot) dialogs.sync(router.snapshot);
  });
  sessionService.start();
  router.beforeNavigate(() => sessionService.ensureActive());

  router.onChange((snapshot) => {
    header.setActiveRoute(snapshot.route);
    burgerMenu.setActiveRoute(snapshot.route);
    dialogs.sync(snapshot);
  });

  router.start();
}
