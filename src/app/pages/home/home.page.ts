import { ComponentBase } from '@app/core/component.base';
import { DeveloperCtaSection } from './components/developer-cta-section';
import { NewGamesSection } from './components/new-games-section';
import { HeroSection } from './components/hero-section';

export class HomePage extends ComponentBase {
  protected render(): HTMLElement {
    const page = document.createElement('div');
    page.classList.add('home-page');

    const hero = new HeroSection();
    hero.mount(page);

    const newGames = new NewGamesSection();
    newGames.mount(page);

    const developerCta = new DeveloperCtaSection();
    developerCta.mount(page);

    return page;
  }
}
