import { Header } from '@widgets/header';
import { Footer } from '@widgets/footer';
import { BurgerMenu } from '@widgets/burger-menu';
import { HomePage } from '@app/pages/home/home.page';

export function bootstrapApp(): void {
  const root = document.createElement('div');
  root.id = 'app';
  document.body.append(root);

  const burgerMenu = new BurgerMenu({
    onAuthClick: (mode) => console.log('open auth dialog:', mode),
  });

  const header = new Header({
    onBurgerClick: () => burgerMenu.open(),
    onAuthClick: (mode) => console.log('open auth dialog:', mode),
  });
  header.mount(root);

  const pageOutlet = document.createElement('main');
  pageOutlet.classList.add('page-outlet');
  root.append(pageOutlet);

  const homePage = new HomePage();
  homePage.mount(pageOutlet);

  const footer = new Footer();
  footer.mount(root);

  burgerMenu.mount(document.body);
}
