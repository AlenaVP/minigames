// @vitest-environment happy-dom
import { type MockInstance, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@app/core/http';
import { gamesApi } from '@app/services/api';
import type { GameComment } from '@shared/types/game-details';
import { snackbar } from '@shared/ui/snackbar';
import { query } from '@testing/dom';
import { makeComment } from '@testing/fixtures';
import { createFakeSessionSource, makeAppSession, type FakeSessionSource } from '@testing/session';
import { COMMENT_MESSAGES, CommentForm } from './comment-form';

const SLUG = 'tukoni-forest-keepers';
const EMAIL = 'forest@rs.school';

function defer<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

const form = (): HTMLFormElement => query<HTMLFormElement>('.comment-form');
const input = (): HTMLTextAreaElement => query<HTMLTextAreaElement>('.comment-form__input');
const send = (): HTMLButtonElement => query<HTMLButtonElement>('.comment-form__submit');
const avatar = (): HTMLElement => query('.comment-form__avatar');

function type(text: string): void {
  input().value = text;
  input().dispatchEvent(new Event('input'));
}

function pressEnter(init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, ...init });
  input().dispatchEvent(event);
  return event;
}

describe('CommentForm', () => {
  let session: FakeSessionSource;
  let requestAuth: ReturnType<typeof vi.fn<() => void>>;
  let onListChanged: ReturnType<typeof vi.fn<() => void>>;
  let postComment: MockInstance<typeof gamesApi.postComment>;
  let commentForm: CommentForm;

  function mount(): void {
    commentForm = new CommentForm({ slug: SLUG, access: { session, requestAuth }, onListChanged });
    commentForm.mount(document.body);
  }

  const settled = (): Promise<void> => vi.waitFor(() => expect(form().hasAttribute('aria-busy')).toBe(false));

  beforeEach(() => {
    session = createFakeSessionSource(makeAppSession({ displayName: 'forestDweller', email: EMAIL }));
    requestAuth = vi.fn<() => void>();
    onListChanged = vi.fn<() => void>();
    postComment = vi.spyOn(gamesApi, 'postComment').mockResolvedValue(makeComment());
    for (const method of ['success', 'error', 'warning', 'info'] as const) vi.spyOn(snackbar, method);
  });

  afterEach(() => {
    commentForm.destroy();
  });

  it('is locked for a guest: no typing, no sending, the generic avatar', () => {
    session = createFakeSessionSource();
    mount();

    expect(input().disabled).toBe(true);
    expect(input().placeholder).toBe('Log in to write a comment...');
    expect(send().disabled).toBe(true);
    expect(avatar().classList.contains('comment-form__avatar--guest')).toBe(true);
  });

  it('shows the uppercase first letter of the user name and lets the user type', () => {
    mount();

    expect(avatar().textContent).toBe('F');
    expect(input().disabled).toBe(false);
    expect(input().placeholder).toBe('Write a comment...');
    expect(input().maxLength).toBe(500);
  });

  it('enables Send only for non-blank text', () => {
    mount();

    type(' '.repeat(3));
    expect(send().disabled).toBe(true);
    type('Nice');
    expect(send().disabled).toBe(false);
  });

  it('sends the trimmed text with the email and a valid author name', async () => {
    mount();
    type('  Such a calming little game!  ');

    form().dispatchEvent(new Event('submit', { cancelable: true }));
    await settled();

    expect(postComment).toHaveBeenCalledWith(
      SLUG,
      EMAIL,
      { authorName: 'forestDweller', text: 'Such a calming little game!' },
      expect.any(AbortSignal),
    );
  });

  it('sends with Enter, but not with Shift+Enter (a new line) or an empty field', async () => {
    mount();

    type('Hello');
    expect(pressEnter({ shiftKey: true }).defaultPrevented).toBe(false);
    expect(postComment).not.toHaveBeenCalled();

    expect(pressEnter().defaultPrevented).toBe(true);
    await settled();
    expect(postComment).toHaveBeenCalledOnce();

    pressEnter();
    expect(postComment).toHaveBeenCalledOnce();
  });

  it('does not send the Enter that confirms an IME word, including Safari (composition already ended)', async () => {
    vi.useFakeTimers();
    mount();
    type('こんにちは');

    pressEnter({ isComposing: true });
    input().dispatchEvent(new Event('compositionstart'));
    input().dispatchEvent(new Event('compositionend'));
    pressEnter();
    expect(postComment).not.toHaveBeenCalled();

    vi.advanceTimersByTime(0);
    pressEnter();
    expect(postComment).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('locks the textarea and Send with a spinner while sending; no second request', async () => {
    const request = defer<GameComment>();
    postComment.mockReturnValue(request.promise);
    mount();
    type('Hello');

    pressEnter();
    expect(input().disabled).toBe(true);
    expect(send().disabled).toBe(true);
    expect(form().classList.contains('comment-form--pending')).toBe(true);

    form().dispatchEvent(new Event('submit', { cancelable: true }));
    expect(postComment).toHaveBeenCalledOnce();

    request.resolve(makeComment());
    await settled();
    expect(input().disabled).toBe(false);
  });

  it('after 201: the field is cleared, the user is told, the list reloads; the focus is back in the field', async () => {
    mount();
    type('Hello');
    input().focus();

    pressEnter();
    // What Chrome does to a focused field that becomes disabled: the focus falls back to <body>
    const elsewhere = document.createElement('button');
    document.body.append(elsewhere);
    elsewhere.focus();
    elsewhere.remove();
    await settled();

    expect(input().value).toBe('');
    expect(send().disabled).toBe(true);
    expect(snackbar.success).toHaveBeenCalledWith(COMMENT_MESSAGES.posted);
    expect(onListChanged).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(input());
  });

  it('rejected: the text stays, the form is free again, nothing reloads', async () => {
    postComment.mockRejectedValue(new HttpError('bad-request', { message: 'Text is too long' }));
    mount();
    type('Hello');

    pressEnter();
    await settled();

    expect(snackbar.error).toHaveBeenCalledWith(COMMENT_MESSAGES.rejected('Text is too long'));
    expect(input().value).toBe('Hello');
    expect(send().disabled).toBe(false);
    expect(onListChanged).not.toHaveBeenCalled();
  });

  it('unknown outcome: not resent — a warning, the text kept, the list reloaded to show what happened', async () => {
    postComment.mockRejectedValue(new HttpError('timeout'));
    mount();
    type('Hello');

    pressEnter();
    await settled();

    expect(postComment).toHaveBeenCalledOnce();
    expect(snackbar.warning).toHaveBeenCalledWith(COMMENT_MESSAGES.unknown);
    expect(input().value).toBe('Hello');
    expect(onListChanged).toHaveBeenCalledOnce();
  });

  it('a session that has just run out: no request, Auth over the game, the draft kept, no second toast', () => {
    mount();
    type('Hello');
    session.expireSilently();

    pressEnter();

    expect(postComment).not.toHaveBeenCalled();
    expect(requestAuth).toHaveBeenCalledOnce();
    expect(snackbar.warning).not.toHaveBeenCalled();
    expect(input().value).toBe('Hello');
    expect(input().disabled).toBe(true);
  });

  it('opens up when a guest signs in while the game is open, keeping what was there', () => {
    session = createFakeSessionSource();
    mount();

    session.emit(makeAppSession({ displayName: 'Mia' }), 'signed-in');

    expect(input().disabled).toBe(false);
    expect(avatar().textContent).toBe('M');
  });

  it('locks again when the session ends mid-request, and ignores that late answer', async () => {
    const request = defer<GameComment>();
    postComment.mockReturnValue(request.promise);
    mount();
    type('Hello');
    pressEnter();

    session.emit(null, 'expired');
    expect(input().disabled).toBe(true);
    expect(form().classList.contains('comment-form--pending')).toBe(false);

    request.resolve(makeComment());
    await request.promise;
    await Promise.resolve();
    expect(input().value).toBe('Hello');
    expect(snackbar.success).not.toHaveBeenCalled();
    expect(onListChanged).not.toHaveBeenCalled();
  });

  it('warns about a text over 500 characters (if one ever gets past maxlength)', () => {
    mount();
    type('a'.repeat(501));

    form().dispatchEvent(new Event('submit', { cancelable: true }));

    expect(snackbar.warning).toHaveBeenCalledWith(COMMENT_MESSAGES.tooLong);
    expect(postComment).not.toHaveBeenCalled();
  });
});
