import { Header } from '@widgets/header';
import { Footer } from '@widgets/footer';
import { BurgerMenu } from '@widgets/burger-menu';
import { AuthDialog } from '@dialogs/auth-dialog';
import { GameDetailsDialog } from '@dialogs/game-details-dialog';
import { HomePage } from '@app/pages/home/home.page';
import { LibraryPage } from '@app/pages/library/library.page';
import { Router } from './router';

export function bootstrapApp(): void {
  const root = document.createElement('div');
  root.id = 'app';
  document.body.append(root);

  const authDialog = new AuthDialog();
  const gameDetailsDialog = new GameDetailsDialog();

  const burgerMenu = new BurgerMenu({
    onAuthClick: (mode) => authDialog.open(mode),
  });

  const header = new Header({
    onBurgerClick: () => burgerMenu.open(),
    onAuthClick: (mode) => authDialog.open(mode),
  });
  header.mount(root);

  const pageOutlet = document.createElement('main');
  pageOutlet.classList.add('page-outlet');
  root.append(pageOutlet);

  new Footer().mount(root);
  burgerMenu.mount(document.body);
  authDialog.mount(document.body);
  gameDetailsDialog.mount(document.body);

  const router = new Router(pageOutlet, {
    home: () => new HomePage(),
    library: () => new LibraryPage(),
  });

  router.onChange((route) => {
    header.setActiveRoute(route);
    burgerMenu.setActiveRoute(route);
  });

  router.start();
}
