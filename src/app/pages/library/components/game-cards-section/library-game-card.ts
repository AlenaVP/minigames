import { ComponentBase } from '@app/core/component.base';
import type { GameSummary } from '@shared/types/game';
import { escapeHtml } from '@shared/utils/escape-html';
import { formatCompactNumber, formatRating } from '@shared/utils/format';
import { getCardCoverUrl } from '@shared/utils/game-cover';
import starIconUrl from '@assets/icons/star.svg';
import favoriteIconUrl from '@assets/icons/favorite.svg';
import './library-game-card.scss';

interface LibraryGameCardOptions {
  game: GameSummary;
  categoryLabel: string;
  onDetailsClick: (slug: string) => void;
}

const FREE_PRICE = 'Free';

export class LibraryGameCard extends ComponentBase {
  private options: LibraryGameCardOptions;

  constructor(options: LibraryGameCardOptions) {
    super();
    this.options = options;
  }

  protected render(): HTMLElement {
    const { game, categoryLabel } = this.options;
    const titleId = `library-card-title-${game.slug}`;
    const name = escapeHtml(game.name);
    const coverUrl = getCardCoverUrl(game.slug);
    const isFree = game.price === FREE_PRICE;

    const card = document.createElement('li');
    card.classList.add('library-card');

    card.innerHTML = `
      <article class="library-card__inner" aria-labelledby="${titleId}">
        ${
          coverUrl
            ? `<img src="${coverUrl}" alt="" width="460" height="215" loading="lazy" class="library-card__image" />`
            : '<div class="library-card__image library-card__image--placeholder"></div>'
        }
        <div class="library-card__body">
          <div class="library-card__header">
            <h2 id="${titleId}" class="library-card__title">${name}</h2>
            <p class="library-card__category">${escapeHtml(categoryLabel)}</p>
            <p class="library-card__price${isFree ? ' library-card__price--free' : ''}">${escapeHtml(game.price)}</p>
          </div>
          <p class="library-card__description">${escapeHtml(game.shortDescription)}</p>
          <div class="library-card__footer">
            <p class="library-card__stats">
              <span class="library-card__stat">
                <img src="${starIconUrl}" alt="Rating" width="20" height="20" class="library-card__icon" />
                ${formatRating(game.rating)}
              </span>
              <span class="library-card__stat">
                <img src="${favoriteIconUrl}" alt="Likes" width="20" height="20" class="library-card__icon" />
                ${formatCompactNumber(game.likesCount)}
              </span>
            </p>
            <button type="button" class="library-card__details">
              Details<span class="visually-hidden">: ${name}</span>
            </button>
          </div>
        </div>
      </article>
    `;

    card.querySelector('.library-card__details')?.addEventListener('click', () => this.options.onDetailsClick(game.slug));

    return card;
  }
}

/**
 * Placeholder with the card's real structure and classes: the same container queries and grid areas
 * place it, and the `.skeleton-text` lines have the height of the text they stand for → no jump on load.
 */
export function renderLibraryGameCardSkeleton(): string {
  return `
    <li class="library-card library-card--skeleton">
      <div class="library-card__inner">
        <span class="library-card__image skeleton"></span>
        <div class="library-card__body">
          <div class="library-card__header">
            <p class="library-card__title"><span class="skeleton-text">Game title placeholder</span></p>
            <p class="library-card__category skeleton">Category</p>
            <p class="library-card__price"><span class="skeleton-text">$0.00</span></p>
          </div>
          <p class="library-card__description">
            <span class="skeleton-text">
              A short description placeholder that is long enough to fill every visible line of the card text
              block, whatever the width of the card is, so the clamped lines look just like the real ones do.
            </span>
          </p>
          <div class="library-card__footer">
            <p class="library-card__stats"><span class="skeleton-text">★ 4.9 ♥ 12.3K</span></p>
            <span class="library-card__details skeleton">Details</span>
          </div>
        </div>
      </div>
    </li>
  `;
}
