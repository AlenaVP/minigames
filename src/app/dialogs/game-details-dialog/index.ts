import { DialogBase } from '@app/core/dialog.base';
import { GAME_DETAILS_MOCK, MOCK_NOW } from '@app/services/mock-data/game-details.mock';
import { GAME_DETAILS_TITLE_ID, GameDetailsContent } from './game-details-content';
import './game-details-dialog.scss';

/**
 * Story 2: always shows the static "Tukoni: Forest Keepers" (Common Game Details Content Requirements).
 * Story 3: open(slug) → GET /games/:slug; Story 4: ?game=slug in the URL.
 */
export class GameDetailsDialog extends DialogBase {
  private content: GameDetailsContent | null = null;

  constructor() {
    super({ className: 'game-details', ariaLabelledBy: GAME_DETAILS_TITLE_ID });
  }

  open(): void {
    if (!this.dialog || this.isOpen) return;

    this.renderContent(this.dialog);
    this.dialog.scrollTop = 0; // the <dialog> element survives between opens — so does its scroll position
    this.show();
  }

  destroy(): void {
    this.content?.destroy();
    this.content = null;
    super.destroy();
  }

  protected renderContent(dialog: HTMLDialogElement): void {
    // The previous content is destroyed, not just overwritten: its child components,
    // listeners and state go away together with the DOM
    this.content?.destroy();
    // Story 2: "now" is frozen at the mockup's moment, so the dates read exactly as in Figma
    this.content = new GameDetailsContent({ game: GAME_DETAILS_MOCK, now: MOCK_NOW });
    this.content.mount(dialog);
  }
}
