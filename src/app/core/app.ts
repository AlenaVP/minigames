import { Header } from '@widgets/header';
import { Footer } from '@widgets/footer';
import { HomePage } from '@app/pages/home/home.page';

export function bootstrapApp(): void {
  const root = document.createElement('div');
  root.id = 'app';
  document.body.append(root);

  const header = new Header();
  header.mount(root);

  const pageOutlet = document.createElement('main');
  pageOutlet.classList.add('page-outlet');
  root.append(pageOutlet);

  const homePage = new HomePage();
  homePage.mount(pageOutlet);

  const footer = new Footer();
  footer.mount(root);
}
