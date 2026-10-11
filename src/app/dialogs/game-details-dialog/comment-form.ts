import { ComponentBase } from '@app/core/component.base';
import { getMutationOutcome, isAbortedRequest } from '@app/core/http';
import { gamesApi } from '@app/services/api';
import { sendIcon } from '@shared/ui/icons';
import { snackbar } from '@shared/ui/snackbar';
import type { AppSession } from '@shared/types/session';
import { getUserInitial } from '@shared/utils/avatar';
import { COMMENT_MAX_LENGTH, checkCommentText, resolveCommentAuthorName } from './comment-rules';
import type { GameDetailsAccess } from './game-details-access';
import './comment-form.scss';

interface CommentFormOptions {
  slug: string;
  access: GameDetailsAccess;
  /** A comment was (or may have been) added: the list should be loaded again */
  onListChanged: () => void;
}

const INPUT_ID = 'game-comment-input';
const PLACEHOLDER = { user: 'Write a comment...', guest: 'Log in to write a comment...' } as const;

export const COMMENT_MESSAGES = {
  signIn: 'Sign in to leave a comment.',
  posted: 'Comment posted.',
  tooLong: `A comment can be up to ${COMMENT_MAX_LENGTH} characters.`,
  rejected: (reason: string) => `Couldn't post your comment. ${reason}`,
  unknown: "Couldn't confirm that your comment was posted. Check the list before sending it again.",
} as const;

/**
 * The comment composer (RSS-QS-4-2-2). Only for a signed-in user; a guest sees it locked.
 *
 *   Enter (no Shift, not while an IME is composing) or Send → trimmed text, 1–500 characters
 *   → locked with a spinner → POST
 *     201      → cleared, the list reloaded with the user's email (total in the heading)
 *     rejected → error toast, the text stays, the user may send again
 *     unknown  → NOT resent: warning, the text stays, the list reloaded so the user can see what happened
 */
export class CommentForm extends ComponentBase {
  private readonly options: CommentFormOptions;
  private session: AppSession | null = null;
  private isPending = false;
  /** Bumped by every session change: an answer to a request of the previous user is dropped */
  private generation = 0;

  constructor(options: CommentFormOptions) {
    super();
    this.options = options;
  }

  mount(parent: HTMLElement): void {
    super.mount(parent);
    this.options.access.session.onChange(({ session }) => this.followSession(session), this.destroySignal);
  }

  protected render(): HTMLElement {
    const form = document.createElement('form');
    form.classList.add('comment-form');
    form.noValidate = true;

    form.innerHTML = `
      <span class="comment-form__avatar" aria-hidden="true"></span>
      <label for="${INPUT_ID}" class="visually-hidden">Write a comment</label>
      <textarea
        id="${INPUT_ID}"
        name="comment"
        class="comment-form__input"
        rows="1"
        maxlength="${COMMENT_MAX_LENGTH}"
      ></textarea>
      <button type="submit" class="comment-form__submit" aria-label="Send comment" disabled>
        ${sendIcon(20)}
      </button>
    `;

    const input = this.input(form);
    input.addEventListener('input', () => this.syncSubmit());

    // An Enter that confirms a Japanese or Chinese word (IME) is not a "send". Chrome/Firefox mark it isComposing;
    // Safari ends the composition BEFORE that keydown, so the flag is cleared only after the current task
    let isComposing = false;
    input.addEventListener('compositionstart', () => {
      isComposing = true;
    });
    input.addEventListener('compositionend', () => {
      setTimeout(() => {
        isComposing = false;
      }, 0);
    });

    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' || event.shiftKey || event.isComposing || isComposing) return;
      event.preventDefault();
      void this.submit();
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      void this.submit();
    });

    return form;
  }

  private async submit(): Promise<void> {
    if (this.isPending || !this.element) return;

    const check = checkCommentText(this.input().value);
    if (!check.ok) {
      if (check.reason === 'too-long') snackbar.warning(COMMENT_MESSAGES.tooLong);
      return;
    }

    const { session, requestAuth } = this.options.access;
    const hadSession = session.current !== null;
    // RSS-QS-4-3-2: checked right before the request; the draft stays for after sign-in
    if (!session.ensureActive() || !session.current) {
      if (!hadSession) snackbar.warning(COMMENT_MESSAGES.signIn);
      requestAuth();
      return;
    }

    const { email } = session.current;
    const authorName = resolveCommentAuthorName(session.current);
    const generation = this.generation;
    const restoreFocus = this.lock();

    try {
      await gamesApi.postComment(this.options.slug, email, { authorName, text: check.text }, this.destroySignal);
      if (generation !== this.generation) return;

      this.input().value = '';
      snackbar.success(COMMENT_MESSAGES.posted);
      this.options.onListChanged();
    } catch (error) {
      if (isAbortedRequest(error) || generation !== this.generation) return;

      if (getMutationOutcome(error) === 'rejected') {
        snackbar.error(COMMENT_MESSAGES.rejected(error instanceof Error ? error.message : ''));
      } else {
        snackbar.warning(COMMENT_MESSAGES.unknown);
        this.options.onListChanged();
      }
    } finally {
      if (generation === this.generation) this.unlock(restoreFocus);
    }
  }

  /** Guest ↔ user: the form locks or unlocks; an answer for the previous user is ignored. The draft is kept */
  private followSession(session: AppSession | null): void {
    if (session?.email !== this.session?.email) this.generation += 1;
    this.session = session;
    this.isPending = false;

    const form = this.element;
    if (!form) return;

    const avatar = form.querySelector<HTMLElement>('.comment-form__avatar');
    const initial = session ? getUserInitial(session.displayName) : '';
    if (avatar) {
      avatar.textContent = initial;
      avatar.classList.toggle('comment-form__avatar--guest', initial === '');
    }

    const input = this.input(form);
    input.disabled = session === null;
    input.placeholder = session ? PLACEHOLDER.user : PLACEHOLDER.guest;
    form.classList.remove('comment-form--pending');
    form.removeAttribute('aria-busy');
    this.syncSubmit();
  }

  /** Send is available only for a signed-in user with some text, and not while a comment is on its way */
  private syncSubmit(): void {
    const submit = this.element?.querySelector<HTMLButtonElement>('.comment-form__submit');
    if (!submit) return;
    submit.disabled = this.isPending || this.session === null || !checkCommentText(this.input().value).ok;
  }

  /** Textarea + Send locked while the request is out. Returns whether the textarea had the focus */
  private lock(): boolean {
    const input = this.input();
    const hadFocus = document.activeElement === input;
    this.isPending = true;
    input.disabled = true;
    this.element?.classList.add('comment-form--pending');
    this.element?.setAttribute('aria-busy', 'true');
    this.syncSubmit();
    return hadFocus;
  }

  private unlock(restoreFocus: boolean): void {
    const input = this.input();
    this.isPending = false;
    input.disabled = this.session === null;
    this.element?.classList.remove('comment-form--pending');
    this.element?.removeAttribute('aria-busy');
    this.syncSubmit();
    // A disabled textarea drops the focus to <body>: back to typing where the user was
    if (restoreFocus && !input.disabled && (document.activeElement === document.body || document.activeElement === null)) {
      input.focus();
    }
  }

  private input(root: ParentNode | null = this.element): HTMLTextAreaElement {
    const input = root?.querySelector<HTMLTextAreaElement>('.comment-form__input');
    if (!input) throw new Error('CommentForm: the textarea is missing');
    return input;
  }
}
