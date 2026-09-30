import { ComponentBase } from '@app/core/component.base';
import { getHeroImageUrl } from '@shared/utils/game-cover';
import './hero.scss';

interface GameDetailsHeroOptions {
  slug: string;
}

export class GameDetailsHero extends ComponentBase {
  private options: GameDetailsHeroOptions;

  constructor(options: GameDetailsHeroOptions) {
    super();
    this.options = options;
  }

  protected render(): HTMLElement {
    const hero = document.createElement('div');
    hero.classList.add('game-details-hero');

    const imageUrl = getHeroImageUrl(this.options.slug);

    hero.innerHTML = imageUrl
      ? `<img src="${imageUrl}" alt="" width="1920" height="1080" class="game-details-hero__image" />`
      : '<div class="game-details-hero__image game-details-hero__image--placeholder"></div>';

    return hero;
  }
}
