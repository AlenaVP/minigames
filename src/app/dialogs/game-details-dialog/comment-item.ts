import { ComponentBase } from '@app/core/component.base';
import type { GameComment } from '@shared/types/game-details';
import { heartOutlineIcon } from '@shared/ui/icons';
import { snackbar } from '@shared/ui/snackbar';
import { decodeHtmlEntities } from '@shared/utils/decode-html';
import { getAvatarColorIndex, getInitial } from '@shared/utils/avatar';
import { escapeHtml } from '@shared/utils/escape-html';
import { formatRelativeTime } from '@shared/utils/format';
import './comment-item.scss';

interface CommentItemOptions {
  comment: GameComment;
  now?: Date;
}

/** One comment, read-only in Story 3: the like state comes from the API (false for a guest). */
export class CommentItem extends ComponentBase {
  private options: CommentItemOptions;

  constructor(options: CommentItemOptions) {
    super();
    this.options = options;
  }

  protected render(): HTMLElement {
    const { comment, now } = this.options;
    const author = escapeHtml(comment.authorName);

    const item = document.createElement('li');

    item.innerHTML = `
      <article class="comment" aria-label="Comment by ${author}">
        <header class="comment__header">
          <span class="comment__avatar comment__avatar--${getAvatarColorIndex(comment.authorName)}" aria-hidden="true">
            ${escapeHtml(getInitial(comment.authorName))}
          </span>
          <span class="comment__author">${author}</span>
          <time class="comment__date" datetime="${escapeHtml(comment.createdAt)}">
            ${formatRelativeTime(comment.createdAt, now)}
          </time>
        </header>
        <p class="comment__text">${escapeHtml(decodeHtmlEntities(comment.text))}</p>
        <button type="button" class="comment__like" aria-pressed="${comment.isLikedByCurrentUser}">
          ${heartOutlineIcon(16)}
          <span class="visually-hidden">Like comment by ${author},</span>
          <span class="comment__like-count">${comment.likesCount}</span>
          <span class="visually-hidden">likes</span>
        </button>
      </article>
    `;

    item.querySelector('.comment__like')?.addEventListener('click', () => snackbar.info('Sign in to like comments.'));

    return item;
  }
}
