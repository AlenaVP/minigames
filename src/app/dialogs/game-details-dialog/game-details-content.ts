import { ComponentBase } from '@app/core/component.base';
import type { GameDetails } from '@shared/types/game-details';
import { closeIcon } from '@shared/ui/icons';
import { escapeHtml } from '@shared/utils/escape-html';
import { GameDetailsHero } from './hero';

export const GAME_DETAILS_TITLE_ID = 'game-details-title';

interface GameDetailsContentOptions {
  game: GameDetails;
}

/**
 * Everything inside the dialog. Created anew on every open → all transient UI state
 * (favorite, likes, comment draft) starts from the default, as the requirements demand.
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

    // The close button is a direct child of the whole content (not of the 220px hero):
    // a sticky element can only stick within its parent, and the parent here is as tall as the dialog.
    // It is also the first focusable element → showModal() puts the focus on it.
    content.innerHTML = `
      <button type="button" class="game-details__close" aria-label="Close game details" data-dialog-close>
        ${closeIcon()}
      </button>
    `;

    this.mountChild(new GameDetailsHero({ slug: game.slug }), content);

    // Step 2 (2-2-4) replaces this with the full info section
    const body = document.createElement('div');
    body.classList.add('game-details__body');
    body.innerHTML = `<h2 id="${GAME_DETAILS_TITLE_ID}" class="game-details__title">${escapeHtml(game.name)}</h2>`;
    content.append(body);

    return content;
  }
}
