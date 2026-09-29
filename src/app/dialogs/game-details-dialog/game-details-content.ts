import { ComponentBase } from '@app/core/component.base';
import type { GameDetails } from '@shared/types/game-details';
import { escapeHtml } from '@shared/utils/escape-html';
import closeIconUrl from '@assets/icons/close.svg';
import heroImageUrl from '@assets/images/games/tukoni-forest-keepers-hero.jpg';

export const GAME_DETAILS_TITLE_ID = 'game-details-title';

interface GameDetailsContentOptions {
  game: GameDetails;
}

/**
 * Everything inside the dialog. Created anew on every open → all transient UI state
 * (favorite, likes, comment draft) starts from the default, as the requirements demand.
 * The sections (hero, info, records, comments) become child components in the next steps.
 */
export class GameDetailsContent extends ComponentBase {
  private options: GameDetailsContentOptions;

  constructor(options: GameDetailsContentOptions) {
    super();
    this.options = options;
  }

  protected render(): HTMLElement {
    const { game } = this.options;

    const content = document.createElement('div');
    content.classList.add('game-details__content');

    content.innerHTML = `
      <div class="game-details__hero">
        <img src="${heroImageUrl}" alt="" width="1920" height="1080" class="game-details__hero-image" />
        <button type="button" class="game-details__close" aria-label="Close game details" data-dialog-close>
          <img src="${closeIconUrl}" alt="Close" />
        </button>
      </div>

      <div class="game-details__body">
        <h2 id="${GAME_DETAILS_TITLE_ID}" class="game-details__title">${escapeHtml(game.name)}</h2>
      </div>
    `;

    return content;
  }
}
