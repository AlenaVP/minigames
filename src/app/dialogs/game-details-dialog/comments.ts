import { ComponentBase } from '@app/core/component.base';
import { gamesApi } from '@app/services/api';
import { AsyncContent } from '@shared/ui/async-content';
import { EmptyState } from '@shared/ui/empty-state';
import type { CommentsPage, GameComment } from '@shared/types/game-details';
import { CommentForm } from './comment-form';
import { CommentItem } from './comment-item';
import type { GameDetailsAccess } from './game-details-access';
import './comments.scss';

interface CommentsSectionOptions {
  slug: string;
  access: GameDetailsAccess;
  /** The moment "ago" is counted from; the real clock by default */
  now?: Date;
}

const TITLE_ID = 'game-comments-title';
/** 3-3-2: the 3 latest comments; the heading still shows the TOTAL count */
const COMMENTS_LIMIT = 3;

export class CommentsSection extends ComponentBase {
  private readonly options: CommentsSectionOptions;
  private area: AsyncContent<CommentsPage> | null = null;

  constructor(options: CommentsSectionOptions) {
    super();
    this.options = options;
  }

  /** The latest comments again — after a comment was posted (or may have been) */
  reload(): void {
    void this.area?.load((signal) => this.requestComments(signal));
  }

  protected render(): HTMLElement {
    const { slug, access, now } = this.options;

    const section = document.createElement('section');
    section.classList.add('comments');
    section.setAttribute('aria-labelledby', TITLE_ID);
    section.innerHTML = `<h3 id="${TITLE_ID}" class="comments__title">Comments</h3>`;

    const title = section.querySelector('.comments__title');

    this.mountChild(new CommentForm({ slug, access, onListChanged: () => this.reload() }), section);

    this.area = this.mountChild(
      new AsyncContent<CommentsPage>({
        label: 'comments',
        request: (signal) => this.requestComments(signal),
        isEmpty: ({ comments }) => comments.length === 0,
        renderSkeleton: () => renderCommentsSkeleton(COMMENTS_LIMIT),
        renderContent: ({ comments }) => new CommentList({ comments, now }),
        renderEmpty: () => new EmptyState({ title: 'No comments yet', message: 'Be the first to share your thoughts.' }),
        onStateChange: (state) => {
          const hasTotal = state.status === 'success' || state.status === 'empty';
          if (title) title.textContent = hasTotal ? `Comments (${state.data.total})` : 'Comments';
        },
      }),
      section,
    );

    return section;
  }

  /** Signed in: with the email, so each comment's isLikedByCurrentUser is about this user; a guest's has none */
  private requestComments(signal: AbortSignal): Promise<CommentsPage> {
    const userEmail = this.options.access.session.current?.email;
    return gamesApi.getComments(this.options.slug, { limit: COMMENTS_LIMIT, sort: 'newest', userEmail }, signal);
  }
}

/** A component (not a bare <ul>): its items are destroyed together with it when the area changes state */
class CommentList extends ComponentBase {
  private readonly options: { comments: readonly GameComment[]; now?: Date };

  constructor(options: { comments: readonly GameComment[]; now?: Date }) {
    super();
    this.options = options;
  }

  protected render(): HTMLElement {
    const list = document.createElement('ul');
    list.classList.add('comments__list');
    for (const comment of this.options.comments) this.mountChild(new CommentItem({ comment, now: this.options.now }), list);
    return list;
  }
}

function renderCommentsSkeleton(count: number): HTMLElement {
  const list = document.createElement('ul');
  list.classList.add('comments__list');
  list.innerHTML = Array.from(
    { length: count },
    () => `
      <li>
        <div class="comment">
          <div class="comment__header">
            <span class="comment__avatar comment__avatar--skeleton skeleton"></span>
            <span class="comment__author"><span class="skeleton-text">PlayerName</span></span>
            <span class="comment__date"><span class="skeleton-text">2 days ago</span></span>
          </div>
          <p class="comment__text">
            <span class="skeleton-text">A placeholder for the comment text, about as long as a typical comment is.</span>
          </p>
          <span class="comment__like"><span class="skeleton-text">♥ 12</span></span>
        </div>
      </li>`,
  ).join('');
  return list;
}
