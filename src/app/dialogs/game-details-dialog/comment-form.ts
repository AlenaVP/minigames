import { ComponentBase } from '@app/core/component.base';
import { sendIcon } from '@shared/ui/icons';
import { snackbar } from '@shared/ui/snackbar';
import './comment-form.scss';

interface CommentFormOptions {
  /** Placeholder avatar of the current user; Story 3: the real user's initial */
  userInitial: string;
}

const INPUT_ID = 'game-comment-input';

/**
 * Layout + UI states. Story 3 is read-only, so sending only explains why it can't happen yet;
 * Story 4: POST the comment, lock the form during the request, show a snackbar.
 */
export class CommentForm extends ComponentBase {
  private options: CommentFormOptions;

  constructor(options: CommentFormOptions) {
    super();
    this.options = options;
  }

  protected render(): HTMLElement {
    const form = document.createElement('form');
    form.classList.add('comment-form');
    form.noValidate = true;

    form.innerHTML = `
      <span class="comment-form__avatar" aria-hidden="true">${this.options.userInitial}</span>
      <label for="${INPUT_ID}" class="visually-hidden">Write a comment</label>
      <textarea
        id="${INPUT_ID}"
        name="comment"
        class="comment-form__input"
        rows="1"
        maxlength="1000"
        placeholder="Write a comment..."
      ></textarea>
      <button type="submit" class="comment-form__submit" aria-label="Send comment" disabled>
        ${sendIcon(20)}
      </button>
    `;

    const input = form.querySelector<HTMLTextAreaElement>('.comment-form__input');
    const submit = form.querySelector<HTMLButtonElement>('.comment-form__submit');

    input?.addEventListener('input', () => {
      if (submit) submit.disabled = input.value.trim() === '';
    });

    // The draft stays in the field: after signing in (Story 4) it can be sent as is
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      snackbar.info('Sign in to leave a comment.');
    });

    return form;
  }
}
