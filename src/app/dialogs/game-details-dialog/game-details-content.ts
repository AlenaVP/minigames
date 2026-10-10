import { ComponentBase } from '@app/core/component.base';
import { gamesApi } from '@app/services/api';
import { AsyncContent } from '@shared/ui/async-content';
import { EmptyState } from '@shared/ui/empty-state';
import type { GameDetails } from '@shared/types/game-details';
import { closeIcon } from '@shared/ui/icons';
import { GameDetailsHero } from './hero';
import { GameInfo } from './game-info';
import { TopRecords } from './top-records';
import { CommentsSection } from './comments';
import { renderGameDetailsSkeleton } from './game-details-skeleton';

export const GAME_DETAILS_TITLE_ID = 'game-details-title';

interface GameDetailsContentOptions {
  slug: string;
  /** "Close" in the Game Not Found state */
  onClose: () => void;
}

/**
 * Everything inside the dialog for ONE game. Created anew on every open → all transient UI state
 * (comment draft, scroll) starts from the default, and requests of the previous game are cancelled.
 *
 *   close button (always)
 *   └─ details area: skeleton → hero + info + records + comments | Game Not Found | error banner
 *                                                         └─ comments area (requested after the details)
 */
export class GameDetailsContent extends ComponentBase {
  private readonly options: GameDetailsContentOptions;

  constructor(options: GameDetailsContentOptions) {
    super();
    this.options = options;
  }

  protected render(): HTMLElement {
    const { slug, onClose } = this.options;

    const content = document.createElement('div');
    content.classList.add('game-details__content');

    content.innerHTML = `
      <button type="button" class="game-details__close" aria-label="Close game details" data-dialog-close>
        ${closeIcon()}
      </button>
    `;

    this.mountChild(
      new AsyncContent<GameDetails>({
        label: 'game details',
        request: (signal) => gamesApi.getGame(slug, signal),
        renderSkeleton: renderGameDetailsSkeleton,
        renderContent: (game) => new GameDetailsView({ game }),
        renderError: (error) =>
          error.kind === 'not-found'
            ? new EmptyState({
                title: 'Game Not Found',
                message: "We couldn't find this game. It may have been removed, or the link is incorrect.",
                action: { label: 'Close', onClick: onClose },
              })
            : null,
      }),
      content,
    );

    return content;
  }
}

/** The loaded game: the comments area lives inside it, so it starts only once the game exists */
class GameDetailsView extends ComponentBase {
  private readonly game: GameDetails;

  constructor({ game }: { game: GameDetails }) {
    super();
    this.game = game;
  }

  protected render(): HTMLElement {
    const { game } = this;

    const view = document.createElement('div');
    view.classList.add('game-details__view');

    this.mountChild(new GameDetailsHero({ slug: game.slug }), view);

    const body = document.createElement('div');
    body.classList.add('game-details__body');
    view.append(body);

    this.mountChild(new GameInfo({ game, titleId: GAME_DETAILS_TITLE_ID }), body);
    this.mountChild(new TopRecords({ records: game.topRecords }), body);
    this.mountChild(new CommentsSection({ slug: game.slug }), body);

    return view;
  }
}
