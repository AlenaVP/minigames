// @vitest-environment happy-dom
import { type MockInstance, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@app/core/http';
import { gamesApi } from '@app/services/api';
import type { CommentLikeState } from '@shared/types/game-details';
import { snackbar } from '@shared/ui/snackbar';
import { query, textOf } from '@testing/dom';
import { makeComment } from '@testing/fixtures';
import { createFakeSessionSource, makeAppSession, type FakeSessionSource } from '@testing/session';
import { LIKE_MESSAGES, CommentLikeButton } from './comment-like-button';

const EMAIL = 'mia@rs.school';
const COMMENT_ID = 'c5d9f2a1-7c3b-4e8f-9a0d-000000000001';

function defer<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((onResolve) => {
    resolve = onResolve;
  });
  return { promise, resolve };
}

const button = (): HTMLButtonElement => query<HTMLButtonElement>('.comment__like');
const pressed = (): string | null => button().getAttribute('aria-pressed');
const count = (): string => textOf(query('.comment__like-count'));
const isLocked = (): boolean => button().disabled && button().classList.contains('comment__like--pending');

describe('CommentLikeButton', () => {
  let session: FakeSessionSource;
  let requestAuth: ReturnType<typeof vi.fn<() => void>>;
  let onListOutdated: ReturnType<typeof vi.fn<() => void>>;
  let toggleCommentLike: MockInstance<typeof gamesApi.toggleCommentLike>;
  let like: CommentLikeButton;

  function mount(overrides: Parameters<typeof makeComment>[0] = {}): void {
    like = new CommentLikeButton({
      comment: makeComment({ commentId: COMMENT_ID, authorName: 'Tom <b>', likesCount: 12, ...overrides }),
      access: { session, requestAuth },
      onListOutdated,
    });
    like.mount(document.body);
  }

  beforeEach(() => {
    session = createFakeSessionSource(makeAppSession({ email: EMAIL }));
    requestAuth = vi.fn<() => void>();
    onListOutdated = vi.fn<() => void>();
    toggleCommentLike = vi.spyOn(gamesApi, 'toggleCommentLike');
    for (const method of ['error', 'warning'] as const) vi.spyOn(snackbar, method);
  });

  afterEach(() => {
    like.destroy();
  });

  it('starts from the personal list state, with an accessible name that tells whose comment it is', () => {
    mount({ isLikedByCurrentUser: true });

    expect(pressed()).toBe('true');
    expect(count()).toBe('12');
    expect(textOf(button())).toBe('Like comment by Tom <b>, 12 likes');
    expect(document.querySelector('.comment__like b')).toBeNull();
  });

  it('a guest: no request — a warning and Auth over the game', () => {
    session = createFakeSessionSource();
    mount();

    button().click();

    expect(toggleCommentLike).not.toHaveBeenCalled();
    expect(snackbar.warning).toHaveBeenCalledExactlyOnceWith(LIKE_MESSAGES.signIn);
    expect(requestAuth).toHaveBeenCalledOnce();
  });

  it('a session that has just run out: no request, Auth, only the expiration toast', () => {
    mount();
    session.expireSilently();

    button().click();

    expect(toggleCommentLike).not.toHaveBeenCalled();
    expect(requestAuth).toHaveBeenCalledOnce();
    expect(snackbar.warning).not.toHaveBeenCalled();
  });

  it('locks with a spinner while the request is out, then shows exactly what the server says', async () => {
    const request = defer<CommentLikeState>();
    toggleCommentLike.mockReturnValue(request.promise);
    mount({ isLikedByCurrentUser: false });

    button().click();
    expect(toggleCommentLike).toHaveBeenCalledWith(COMMENT_ID, EMAIL, expect.any(AbortSignal));
    expect(isLocked()).toBe(true);
    expect(button().getAttribute('aria-busy')).toBe('true');

    request.resolve({ isLikedByCurrentUser: true, likesCount: 13 });
    await vi.waitFor(() => expect(isLocked()).toBe(false));
    expect(pressed()).toBe('true');
    expect(count()).toBe('13');
  });

  it('trusts the answer over a local guess (e.g. the like was already toggled in another tab)', async () => {
    toggleCommentLike.mockResolvedValue({ isLikedByCurrentUser: false, likesCount: 7 });
    mount({ isLikedByCurrentUser: false, likesCount: 12 });

    button().click();
    await vi.waitFor(() => expect(isLocked()).toBe(false));

    expect(pressed()).toBe('false');
    expect(count()).toBe('7');
  });

  it('never sends a second toggle while the first is out', () => {
    toggleCommentLike.mockReturnValue(defer<CommentLikeState>().promise);
    mount();

    button().click();
    // Even if the lock is lifted by hand (DevTools)
    button().disabled = false;
    button().click();

    expect(toggleCommentLike).toHaveBeenCalledOnce();
  });

  it('rejected (404): the server message, the state unchanged, free again, no reload', async () => {
    toggleCommentLike.mockRejectedValue(new HttpError('not-found', { message: 'Comment not found' }));
    mount({ isLikedByCurrentUser: true });

    button().click();
    await vi.waitFor(() => expect(isLocked()).toBe(false));

    expect(snackbar.error).toHaveBeenCalledWith(LIKE_MESSAGES.rejected('Comment not found'));
    expect(pressed()).toBe('true');
    expect(count()).toBe('12');
    expect(onListOutdated).not.toHaveBeenCalled();
  });

  it('unknown outcome (5xx): not repeated — a warning and the list reloaded for the real state', async () => {
    toggleCommentLike.mockRejectedValue(new HttpError('server'));
    mount();

    button().click();
    await vi.waitFor(() => expect(isLocked()).toBe(false));

    expect(toggleCommentLike).toHaveBeenCalledOnce();
    expect(snackbar.warning).toHaveBeenCalledWith(LIKE_MESSAGES.unknown);
    expect(onListOutdated).toHaveBeenCalledOnce();
  });

  it('stays silent when it is replaced while the request is out (the list reloaded for another user)', async () => {
    toggleCommentLike.mockImplementation(
      (_id, _email, signal) =>
        new Promise((_resolve, reject) => {
          signal?.addEventListener('abort', () => reject(new HttpError('aborted')));
        }),
    );
    mount();
    button().click();

    like.destroy();
    await Promise.resolve();

    expect(snackbar.error).not.toHaveBeenCalled();
    expect(snackbar.warning).not.toHaveBeenCalled();
    expect(onListOutdated).not.toHaveBeenCalled();
  });
});
