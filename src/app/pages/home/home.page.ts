import { ComponentBase } from '@app/core/component.base';
import { HeroSection } from './components/hero-section';
import { NewGamesSection } from './components/new-games-section';
import { TopPlayersSection } from './components/top-players-section';
import { DeveloperCtaSection } from './components/developer-cta-section';

interface HomePageOptions {
  onGameDetails: (slug: string) => void;
}

export class HomePage extends ComponentBase {
  private options: HomePageOptions;

  constructor(options: HomePageOptions) {
    super();
    this.options = options;
  }

  protected render(): HTMLElement {
    const page = document.createElement('div');
    page.classList.add('home-page');

    this.mountChild(new HeroSection(), page);
    this.mountChild(new NewGamesSection({ onGameDetails: this.options.onGameDetails }), page);
    this.mountChild(new TopPlayersSection(), page);
    this.mountChild(new DeveloperCtaSection(), page);

    return page;
  }
}
