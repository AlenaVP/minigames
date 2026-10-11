import { ComponentBase } from '@app/core/component.base';
import type { GameComment } from '@shared/types/game-details';
import { decodeHtmlEntities } from '@shared/utils/decode-html';
import { getUserInitial } from '@shared/utils/avatar';
import { escapeHtml } from '@shared/utils/escape-html';
import { formatRelativeTime } from '@shared/utils/format';
import { CommentLikeButton } from './comment-like-button';
import type { GameDetailsAccess } from './game-details-access';
import './comment-item.scss';

interface CommentItemOptions {
  comment: GameComment;
  /** 1…5, from the section's AvatarColorRegistry: stable per author while the comments view lives */
  avatarColor: number;
  access: GameDetailsAccess;
  onListOutdated: () => void;
  now?: Date;
}

/** One comment; its like button is the only interactive part */
export class CommentItem extends ComponentBase {
  private options: CommentItemOptions;

  constructor(options: CommentItemOptions) {
    super();
    this.options = options;
  }

  protected render(): HTMLElement {
    const { comment, avatarColor, now } = this.options;
    const author = escapeHtml(comment.authorName);

    const item = document.createElement('li');

    item.innerHTML = `
      <article class="comment" aria-label="Comment by ${author}">
        <header class="comment__header">
          <span class="comment__avatar comment__avatar--${avatarColor}" aria-hidden="true">
            ${escapeHtml(getUserInitial(comment.authorName) || '?')}
          </span>
          <span class="comment__author">${author}</span>
          <time class="comment__date" datetime="${escapeHtml(comment.createdAt)}">
            ${formatRelativeTime(comment.createdAt, now)}
          </time>
        </header>
        <p class="comment__text">${escapeHtml(decodeHtmlEntities(comment.text))}</p>
      </article>
    `;

    const article = item.querySelector<HTMLElement>('.comment');
    if (article) {
      const { access, onListOutdated } = this.options;
      this.mountChild(new CommentLikeButton({ comment, access, onListOutdated }), article);
    }

    return item;
  }
}
