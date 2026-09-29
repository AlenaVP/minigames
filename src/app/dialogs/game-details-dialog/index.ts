import { DialogBase } from '@app/core/dialog.base';
import heroImageUrl from '@assets/images/games/tukoni-forest-keepers-hero.jpg';
import closeIconUrl from '@assets/icons/close.svg';
import './game-details-dialog.scss';

const TITLE_ID = 'game-details-title';

/**
 * Story 2: always shows the static "Tukoni: Forest Keepers" (Common Game Details Content Requirements).
 * Story 3: open(slug) → GET /games/:slug; Story 4: ?game=slug in the URL.
 *
 * Step C = shell only (hero, close, title). Info, records and comments come in tasks 2-2-3…2-2-6.
 */
export class GameDetailsDialog extends DialogBase {
  constructor() {
    super({ className: 'game-details', ariaLabelledBy: TITLE_ID });
  }

  open(): void {
    if (!this.dialog || this.isOpen) return;

    // Fresh markup on every open = every local state (favorite, likes, textarea) is reset for free
    this.renderContent(this.dialog);
    this.show();
  }

  protected renderContent(dialog: HTMLDialogElement): void {
    dialog.innerHTML = `
      <article class="game-details__inner">
        <div class="game-details__hero">
          <img src="${heroImageUrl}" alt="" width="1920" height="1080" class="game-details__hero-image" />
          <button type="button" class="game-details__close" aria-label="Close game details" data-dialog-close>
            <button type="button" class="game-details__close" aria-label="Close game details" data-dialog-close>
              <img src="${closeIconUrl}" alt="Close" />
            </button>
          </button>
        </div>

        <div class="game-details__body">
          <h2 id="${TITLE_ID}" class="game-details__title">Tukoni: Forest Keepers</h2>
        </div>
      </article>
    `;
  }
}
