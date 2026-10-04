import { DialogBase } from '@app/core/dialog.base';
import { GAME_DETAILS_TITLE_ID, GameDetailsContent } from './game-details-content';
import './game-details-dialog.scss';

/**
 * open(slug) → GET /games/{slug} (+ its comments). Branch spa-router: ?game=slug in the URL.
 */
export class GameDetailsDialog extends DialogBase {
  private content: GameDetailsContent | null = null;

  constructor() {
    super({
      className: 'game-details',
      ariaLabelledBy: GAME_DETAILS_TITLE_ID,
      // While loading / in the error states there is no title yet: an aria-labelledby pointing to
      // a missing id is ignored, and the dialog falls back to this name
      ariaLabel: 'Game details',
    });
  }

  open(slug: string): void {
    if (!this.dialog || this.isOpen) return;

    this.replaceContent(slug);
    this.dialog.scrollTop = 0;
    this.show();
  }

  destroy(): void {
    this.content?.destroy();
    this.content = null;
    super.destroy();
  }

  /** Nothing to show until open(slug) */
  protected renderContent(dialog: HTMLDialogElement): void {
    // Closed → cancel what is still loading and free the content, but only after the closing animation
    dialog.addEventListener('close', () => {
      void Promise.allSettled(dialog.getAnimations().map((animation) => animation.finished)).then(() => {
        if (!dialog.open) this.clearContent();
      });
    });
  }

  private replaceContent(slug: string): void {
    if (!this.dialog) return;

    this.clearContent();
    this.content = new GameDetailsContent({ slug, onClose: () => this.close() });
    this.content.mount(this.dialog);
  }

  private clearContent(): void {
    this.content?.destroy();
    this.content = null;
  }
}
