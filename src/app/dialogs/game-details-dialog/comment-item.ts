import { ComponentBase } from '@app/core/component.base';
import type { GameComment } from '@shared/types/game-details';
import { heartOutlineIcon } from '@shared/ui/icons';
import { getAvatarColorIndex, getInitial } from '@shared/utils/avatar';
import { escapeHtml } from '@shared/utils/escape-html';
import { formatRelativeTime } from '@shared/utils/format';
import './comment-item.scss';

interface CommentItemOptions {
  comment: GameComment;
  now?: Date;
}

/** One comment with its own like state: toggling here never touches the other comments. */
export class CommentItem extends ComponentBase {
  private options: CommentItemOptions;
  private isLiked: boolean;

  constructor(options: CommentItemOptions) {
    super();
    this.options = options;
    this.isLiked = options.comment.isLikedByCurrentUser;
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
        <p class="comment__text">${escapeHtml(comment.text)}</p>
        <button type="button" class="comment__like" aria-pressed="${this.isLiked}">
          ${heartOutlineIcon(16)}
          <span class="visually-hidden">Like comment by ${author},</span>
          <span class="comment__like-count">${comment.likesCount}</span>
          <span class="visually-hidden">likes</span>
        </button>
      </article>
    `;

    const likeButton = item.querySelector<HTMLButtonElement>('.comment__like');

    likeButton?.addEventListener('click', () => {
      this.isLiked = !this.isLiked;
      likeButton.setAttribute('aria-pressed', String(this.isLiked));
    });

    return item;
  }
}
