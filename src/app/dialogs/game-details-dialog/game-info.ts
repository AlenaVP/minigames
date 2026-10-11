import { ComponentBase } from '@app/core/component.base';
import type { GameDetails, GameSpecs } from '@shared/types/game-details';
import { escapeHtml } from '@shared/utils/escape-html';
import { formatCompactNumber, formatRating } from '@shared/utils/format';
import starIconUrl from '@assets/icons/star.svg';
import favoriteIconUrl from '@assets/icons/favorite.svg';
import { FavoriteButton } from './favorite-button';
import type { GameDetailsAccess } from './game-details-access';
import './game-info.scss';

interface GameInfoOptions {
  game: GameDetails;
  titleId: string;
  access: GameDetailsAccess;
  /** The email the game was requested with (null = as a guest) */
  loadedFor: string | null;
}

const SPEC_LABELS: Record<keyof GameSpecs, string> = {
  genre: 'Genre',
  players: 'Players',
  duration: 'Duration',
  price: 'Price',
};

const FREE_PRICE = 'Free';

export class GameInfo extends ComponentBase {
  private options: GameInfoOptions;

  constructor(options: GameInfoOptions) {
    super();
    this.options = options;
  }

  protected render(): HTMLElement {
    const { game, titleId } = this.options;
    const price = game.specs.price;
    const primaryLabel = price === FREE_PRICE ? 'Play Now' : `Buy Now: ${escapeHtml(price)}`;

    const info = document.createElement('div');
    info.classList.add('game-info');

    const specs = (Object.keys(SPEC_LABELS) as (keyof GameSpecs)[])
      .map(
        (key) => `
        <div class="game-info__spec">
          <dt class="game-info__spec-label">${SPEC_LABELS[key]}</dt>
          <dd class="game-info__spec-value">${escapeHtml(game.specs[key])}</dd>
        </div>`,
      )
      .join('');

    info.innerHTML = `
      <div class="game-info__heading">
        <h2 id="${titleId}" class="game-info__title">${escapeHtml(game.name)}</h2>
        <p class="game-info__stats">
          <span class="game-info__stat">
            <img src="${starIconUrl}" alt="Rating" width="24" height="24" class="game-info__icon" />
            ${formatRating(game.rating)}
          </span>
          <span class="game-info__stat">
            <img src="${favoriteIconUrl}" alt="Likes" width="24" height="24" class="game-info__icon" />
            <span class="game-info__likes-count">${formatCompactNumber(game.likesCount)}</span>
          </span>
        </p>
      </div>

      <p class="game-info__description">${escapeHtml(game.fullDescription)}</p>

      <dl class="game-info__specs">${specs}</dl>

      <div class="game-info__actions">
        <button type="button" class="game-info__action game-info__action--play">${primaryLabel}</button>
      </div>
    `;

    const actions = info.querySelector<HTMLElement>('.game-info__actions');
    if (actions) {
      this.mountChild(
        new FavoriteButton({
          slug: game.slug,
          isFavorited: game.isLikedByCurrentUser,
          loadedFor: this.options.loadedFor,
          access: this.options.access,
          onLikesCount: (count) => this.setLikesCount(count),
        }),
        actions,
      );
    }

    return info;
  }

  private setLikesCount(count: number): void {
    const element = this.element?.querySelector('.game-info__likes-count');
    if (element) element.textContent = formatCompactNumber(count);
  }
}
