import { ComponentBase } from '@app/core/component.base';
import { getMutationOutcome, isAbortedRequest } from '@app/core/http';
import { gamesApi } from '@app/services/api';
import type { GameComment } from '@shared/types/game-details';
import { heartOutlineIcon } from '@shared/ui/icons';
import { snackbar } from '@shared/ui/snackbar';
import { lockButton, unlockButton } from '@shared/utils/button-lock';
import { escapeHtml } from '@shared/utils/escape-html';
import type { GameDetailsAccess } from './game-details-access';

interface CommentLikeButtonOptions {
  comment: GameComment;
  access: GameDetailsAccess;
  /** The shown like state may be wrong (unknown outcome): the list should be loaded again */
  onListOutdated: () => void;
}

const PENDING_CLASS = 'comment__like--pending';

export const LIKE_MESSAGES = {
  signIn: 'Sign in to like comments.',
  rejected: (reason: string) => `Couldn't update the like. ${reason}`,
  unknown: "Couldn't confirm the like. Reloading the comments…",
} as const;

/**
 * Like / unlike a comment (RSS-QS-4-2-4). The state comes from the server only:
 * the personal comments list at first (isLikedByCurrentUser), then each toggle's answer.
 *
 *   guest / expired → no request: Auth over the game (+ one toast)
 *   signed in       → locked with a spinner → POST → pressed state + count from the answer
 *     rejected      → error toast, unchanged, may be tried again
 *     unknown       → NOT repeated (a toggle would undo itself): warning + the list reloaded (a safe GET)
 *
 * A session change reloads the whole list (CommentsSection), which replaces this button — a request still out
 * is aborted with it, so an answer for the previous user can never land.
 */
export class CommentLikeButton extends ComponentBase {
  private readonly options: CommentLikeButtonOptions;
  private isLiked: boolean;
  private likesCount: number;
  private isPending = false;

  constructor(options: CommentLikeButtonOptions) {
    super();
    this.options = options;
    this.isLiked = options.comment.isLikedByCurrentUser;
    this.likesCount = options.comment.likesCount;
  }

  protected render(): HTMLElement {
    const author = escapeHtml(this.options.comment.authorName);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'comment__like';
    // The text stays the same, the state is "pressed or not" → aria-pressed (unlike the favorites button)
    button.innerHTML = `
      ${heartOutlineIcon(16)}
      <span class="visually-hidden">Like comment by ${author},</span>
      <span class="comment__like-count"></span>
      <span class="visually-hidden">likes</span>
    `;
    button.addEventListener('click', () => void this.handleClick());
    this.paint(button);
    return button;
  }

  private async handleClick(): Promise<void> {
    if (this.isPending || !(this.element instanceof HTMLButtonElement)) return;

    const { session, requestAuth } = this.options.access;
    const hadSession = session.current !== null;
    // RSS-QS-4-3-2: checked right before the request; an expired session has just shown its own (single) toast
    if (!session.ensureActive() || !session.current) {
      if (!hadSession) snackbar.warning(LIKE_MESSAGES.signIn);
      requestAuth();
      return;
    }

    const button = this.element;
    this.isPending = true;
    const restoreFocus = lockButton(button, PENDING_CLASS);

    try {
      const state = await gamesApi.toggleCommentLike(
        this.options.comment.commentId,
        session.current.email,
        this.destroySignal,
      );
      this.isLiked = state.isLikedByCurrentUser;
      this.likesCount = state.likesCount;
      this.paint(button);
    } catch (error) {
      if (isAbortedRequest(error)) return;

      if (getMutationOutcome(error) === 'rejected') {
        snackbar.error(LIKE_MESSAGES.rejected(error instanceof Error ? error.message : ''));
      } else {
        snackbar.warning(LIKE_MESSAGES.unknown);
        this.options.onListOutdated();
      }
    } finally {
      this.isPending = false;
      if (this.element) unlockButton(button, PENDING_CLASS, restoreFocus);
    }
  }

  private paint(button: HTMLElement): void {
    button.setAttribute('aria-pressed', String(this.isLiked));
    const count = button.querySelector('.comment__like-count');
    if (count) count.textContent = String(this.likesCount);
  }
}
