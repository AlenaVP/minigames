import { ComponentBase } from '@app/core/component.base';
import { sendIcon } from '@shared/ui/icons';
import './comment-form.scss';

interface CommentFormOptions {
  /** Placeholder avatar of the current user; Story 3: the real user's initial */
  userInitial: string;
}

const INPUT_ID = 'game-comment-input';

/**
 * Story 2: layout + UI states only. Submitting does nothing (2-2-6);
 * Story 3: POST the comment, lock the form during the request, show a snackbar.
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

    // Auto-grow (up to 88px, then an inner scrollbar) is pure CSS: field-sizing: content
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

    // Style guide "Disabled / Empty": nothing to send → the button is disabled
    input?.addEventListener('input', () => {
      if (submit) submit.disabled = input.value.trim() === '';
    });

    form.addEventListener('submit', (event) => event.preventDefault());

    return form;
  }
}
