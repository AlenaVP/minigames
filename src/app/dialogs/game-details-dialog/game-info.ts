import { ComponentBase } from '@app/core/component.base';
import type { GameDetails, GameSpecs } from '@shared/types/game-details';
import { escapeHtml } from '@shared/utils/escape-html';
import { formatCompactNumber, formatRating } from '@shared/utils/format';
import starIconUrl from '@assets/icons/star.svg';
import favoriteIconUrl from '@assets/icons/favorite.svg';
import './game-info.scss';

interface GameInfoOptions {
  game: GameDetails;
  titleId: string;
}

const SPEC_LABELS: Record<keyof GameSpecs, string> = {
  genre: 'Genre',
  players: 'Players',
  duration: 'Duration',
  price: 'Price',
};

const FAVORITE_LABEL = { off: 'Add to Favorites', on: 'Remove from Favorites' } as const;

export class GameInfo extends ComponentBase {
  private options: GameInfoOptions;
  // Story 2: local only, reset on every open (the whole dialog content is recreated)
  private isFavorite: boolean;

  constructor(options: GameInfoOptions) {
    super();
    this.options = options;
    this.isFavorite = options.game.isLikedByCurrentUser;
  }

  protected render(): HTMLElement {
    const { game, titleId } = this.options;

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
            ${formatCompactNumber(game.likesCount)}
          </span>
        </p>
      </div>

      <p class="game-info__description">${escapeHtml(game.fullDescription)}</p>

      <dl class="game-info__specs">${specs}</dl>

      <div class="game-info__actions">
        <!-- Story 2: no action on purpose; Story 3 adds "Buy Now: $x" for paid games -->
        <button type="button" class="game-info__action game-info__action--play">Play Now</button>
      </div>
    `;

    return info;
  }
}
