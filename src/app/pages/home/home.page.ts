import { ComponentBase } from '@app/core/component.base';
import { HeroSection } from './components/hero-section';

export class HomePage extends ComponentBase {
  protected render(): HTMLElement {
    const page = document.createElement('div');
    page.classList.add('home-page');

    const hero = new HeroSection();
    hero.mount(page);

    return page;
  }
}
