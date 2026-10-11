import { DialogBase } from '@app/core/dialog.base';
import type { GameDetailsAccess } from './game-details-access';
import { GAME_DETAILS_TITLE_ID, GameDetailsContent } from './game-details-content';
import './game-details-dialog.scss';

interface GameDetailsDialogOptions {
  access: GameDetailsAccess;
  onClose?: () => void;
}

/**
 * open(slug) → GET /games/{slug} (+ its comments). Driven by ?game=<slug> in the URL.
 */
export class GameDetailsDialog extends DialogBase {
  private content: GameDetailsContent | null = null;
  private slug: string | null = null;
  /** Hidden under Auth (?game=x&auth=…): the content (loaded data, comment draft, scroll) waits to be shown again */
  private isSuspended = false;
  private readonly access: GameDetailsAccess;

  constructor({ access, onClose }: GameDetailsDialogOptions) {
    super({
      className: 'game-details',
      ariaLabelledBy: GAME_DETAILS_TITLE_ID,
      ariaLabel: 'Game details',
      onClose,
    });
    this.access = access;
  }

  /**
   * Idempotent: the same game again does nothing; another game (Back/Forward between two ?game=) swaps the content.
   * After suspend() the same game is shown again as it was — no new request, the draft and scroll are kept.
   */
  open(slug: string): void {
    if (!this.dialog || (this.isOpen && slug === this.slug)) return;

    const isResume = this.isSuspended && slug === this.slug && this.content !== null;
    this.isSuspended = false;
    if (!isResume) this.loadGame(slug);
    this.show();
  }

  /**
   * Auth takes the screen (RSS-QS-4-3-2 / 4-3-4: only one dialog is active) while ?game=x stays in the URL.
   * Also for a deep link with both keys: the game starts loading underneath, ready for the moment Auth closes.
   */
  suspend(slug: string): void {
    if (!this.dialog) return;

    if (slug !== this.slug || this.content === null) this.loadGame(slug);
    this.isSuspended = true;
    this.hide();
  }

  /** The URL no longer names a game: closes it, or drops the suspended content */
  close(): void {
    if (this.isSuspended) {
      this.isSuspended = false;
      this.clearContent();
    }
    super.close();
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
        if (!dialog.open && !this.isSuspended) this.clearContent();
      });
    });
  }

  private loadGame(slug: string): void {
    this.slug = slug;
    this.replaceContent(slug);
    if (this.dialog) this.dialog.scrollTop = 0;
  }

  private replaceContent(slug: string): void {
    if (!this.dialog) return;

    this.clearContent();
    this.content = new GameDetailsContent({ slug, access: this.access, onClose: () => this.close() });
    this.content.mount(this.dialog);
  }

  private clearContent(): void {
    this.content?.destroy();
    this.content = null;
  }
}
