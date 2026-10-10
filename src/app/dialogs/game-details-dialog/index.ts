import { DialogBase } from '@app/core/dialog.base';
import { GAME_DETAILS_TITLE_ID, GameDetailsContent } from './game-details-content';
import './game-details-dialog.scss';

interface GameDetailsDialogOptions {
  onClose?: () => void;
}

/**
 * open(slug) → GET /games/{slug} (+ its comments). Driven by ?game=<slug> in the URL.
 */
export class GameDetailsDialog extends DialogBase {
  private content: GameDetailsContent | null = null;
  private slug: string | null = null;

  constructor({ onClose }: GameDetailsDialogOptions = {}) {
    super({
      className: 'game-details',
      ariaLabelledBy: GAME_DETAILS_TITLE_ID,
      ariaLabel: 'Game details',
      onClose,
    });
  }

  /** Idempotent: the same game again does nothing; another game (Back/Forward between two ?game=) swaps the content */
  open(slug: string): void {
    if (!this.dialog || (this.isOpen && slug === this.slug)) return;

    this.slug = slug;
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
