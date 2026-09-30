import { ComponentBase } from '@app/core/component.base';
import type { GameComment, GameDetails } from '@shared/types/game-details';
import { closeIcon } from '@shared/ui/icons';
import { GameDetailsHero } from './hero';
import { GameInfo } from './game-info';
import { TopRecords } from './top-records';
import { CommentsSection } from './comments';

export const GAME_DETAILS_TITLE_ID = 'game-details-title';

interface GameDetailsContentOptions {
  game: GameDetails;
  comments: readonly GameComment[];
  /** The moment relative dates are counted from ("2 days ago"); defaults to the real clock */
  now?: Date;
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
    const { game, comments, now } = this.options;

    const content = document.createElement('div');
    content.classList.add('game-details__content');

    content.innerHTML = `
      <button type="button" class="game-details__close" aria-label="Close game details" data-dialog-close>
        ${closeIcon()}
      </button>
    `;

    this.mountChild(new GameDetailsHero({ slug: game.slug }), content);

    const body = document.createElement('div');
    body.classList.add('game-details__body');
    content.append(body);

    this.mountChild(new GameInfo({ game, titleId: GAME_DETAILS_TITLE_ID }), body);
    this.mountChild(new TopRecords({ records: game.topRecords, now }), body);
    this.mountChild(new CommentsSection({ comments, now }), body);

    return content;
  }
}
