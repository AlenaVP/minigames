import { ComponentBase } from '@app/core/component.base';
import type { GameDetails, GameSpecs } from '@shared/types/game-details';
import { heartOutlineIcon } from '@shared/ui/icons';
import { snackbar } from '@shared/ui/snackbar';
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
            ${formatCompactNumber(game.likesCount)}
          </span>
        </p>
      </div>

      <p class="game-info__description">${escapeHtml(game.fullDescription)}</p>

      <dl class="game-info__specs">${specs}</dl>

      <div class="game-info__actions">
        <button type="button" class="game-info__action game-info__action--play">${primaryLabel}</button>
        <button type="button" class="game-info__action game-info__action--favorite">
          ${heartOutlineIcon()}
          <span class="game-info__favorite-label"></span>
        </button>
      </div>
    `;

    const favoriteButton = info.querySelector<HTMLButtonElement>('.game-info__action--favorite');

    if (favoriteButton) {
      this.syncFavorite(favoriteButton, game.isLikedByCurrentUser);
      favoriteButton.addEventListener('click', () => snackbar.info('Sign in to add games to your favorites.'));
    }

    return info;
  }

  /**
   * The visible text itself says what the button will do ("Add…" / "Remove…"),
   * so no aria-pressed: a changing label + pressed state would be a double, contradicting signal.
   * On mobile the text is only visually hidden → it is still the accessible name of the icon button.
   */
  private syncFavorite(button: HTMLButtonElement, isFavorite: boolean): void {
    button.classList.toggle('game-info__action--favorite-active', isFavorite);

    const label = button.querySelector('.game-info__favorite-label');
    if (label) label.textContent = isFavorite ? FAVORITE_LABEL.on : FAVORITE_LABEL.off;
  }
}
