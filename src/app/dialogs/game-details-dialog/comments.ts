import { ComponentBase } from '@app/core/component.base';
import type { GameComment } from '@shared/types/game-details';
import { CommentForm } from './comment-form';
import { CommentItem } from './comment-item';
import './comments.scss';

interface CommentsSectionOptions {
  comments: readonly GameComment[];
  now?: Date;
}

const TITLE_ID = 'game-comments-title';
// Story 3: the logged-in user's initial (and no form at all for guests)
const CURRENT_USER_INITIAL = 'U';

export class CommentsSection extends ComponentBase {
  private options: CommentsSectionOptions;

  constructor(options: CommentsSectionOptions) {
    super();
    this.options = options;
  }

  protected render(): HTMLElement {
    const { comments, now } = this.options;

    const section = document.createElement('section');
    section.classList.add('comments');
    section.setAttribute('aria-labelledby', TITLE_ID);

    section.innerHTML = `
      <h3 id="${TITLE_ID}" class="comments__title">Comments (${comments.length})</h3>
    `;

    this.mountChild(new CommentForm({ userInitial: CURRENT_USER_INITIAL }), section);

    const list = document.createElement('ul');
    list.classList.add('comments__list');
    section.append(list);

    for (const comment of comments) {
      this.mountChild(new CommentItem({ comment, now }), list);
    }

    return section;
  }
}
