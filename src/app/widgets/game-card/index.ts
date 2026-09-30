import { ComponentBase } from '@app/core/component.base';
import type { GameSummary } from '@shared/types/game';
import { escapeHtml } from '@shared/utils/escape-html';
import { formatCompactNumber, formatRating } from '@shared/utils/format';
import { getCardCoverUrl } from '@shared/utils/game-cover';
import starIconUrl from '@assets/icons/star.svg';
import favoriteIconUrl from '@assets/icons/favorite.svg';
import './game-card.scss';

interface GameCardOptions {
  game: GameSummary;
  onClick: (slug: string) => void;
  /** Size/position class set by the parent (the slider) */
  className?: string;
}

/**
 * Image card of the Home slider. The whole card is ONE button:
 * a card of any size (even the narrow image-only one) opens the Game Details dialog.
 */
export class GameCard extends ComponentBase {
  private options: GameCardOptions;

  constructor(options: GameCardOptions) {
    super();
    this.options = options;
  }

  protected render(): HTMLElement {
    const { game, className } = this.options;
    const name = escapeHtml(game.name);
    const rating = formatRating(game.rating);
    const likes = formatCompactNumber(game.likesCount);
    const coverUrl = getCardCoverUrl(game.slug);

    const card = document.createElement('li');
    card.classList.add('game-card');
    if (className) card.classList.add(className);

    card.innerHTML = `
      <button
        type="button"
        class="game-card__inner"
        aria-haspopup="dialog"
        aria-label="${name}, rating ${rating}, ${likes} likes"
      >
        ${
          coverUrl
            ? `<img src="${coverUrl}" alt="" width="460" height="215" class="game-card__image" />`
            : '<span class="game-card__placeholder"></span>'
        }
        <span class="game-card__overlay" aria-hidden="true">
          <span class="game-card__title">${name}</span>
          <span class="game-card__meta">
            <span class="game-card__rating">
              <img src="${starIconUrl}" alt="" class="game-card__icon" />
              ${rating}
            </span>
            <span class="game-card__likes">
              <img src="${favoriteIconUrl}" alt="" class="game-card__icon" />
              ${likes}
            </span>
          </span>
        </span>
      </button>
    `;

    card.querySelector('.game-card__inner')?.addEventListener('click', () => this.options.onClick(game.slug));

    return card;
  }
}
