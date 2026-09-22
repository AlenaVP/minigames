import { ComponentBase } from '@app/core/component.base';
import { HeroSection } from './components/hero-section';
import { NewGamesSection } from './components/new-games-section';
import { TopPlayersSection } from './components/top-players-section';
import { DeveloperCtaSection } from './components/developer-cta-section';

export class HomePage extends ComponentBase {
  protected render(): HTMLElement {
    const page = document.createElement('div');
    page.classList.add('home-page');

    new HeroSection().mount(page);
    new NewGamesSection().mount(page);
    new TopPlayersSection().mount(page);
    new DeveloperCtaSection().mount(page);

    return page;
  }
}
