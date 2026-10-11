// @vitest-environment happy-dom
import { type MockInstance, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@app/core/http';
import { gamesApi } from '@app/services/api';
import type { CommentsPage } from '@shared/types/game-details';
import { snackbar } from '@shared/ui/snackbar';
import { query, queryAll, textOf } from '@testing/dom';
import { makeComment, makeGameDetails } from '@testing/fixtures';
import { GameDetailsDialog } from '.';

function makeCommentsPage(overrides: Partial<CommentsPage> = {}): CommentsPage {
  return { comments: [makeComment()], total: 12, ...overrides };
}

const dialogElement = (): HTMLDialogElement => query<HTMLDialogElement>('dialog.game-details');
const loaded = (): Promise<void> =>
  vi.waitFor(() => expect(document.querySelector('.comments .async-content')?.getAttribute('aria-busy')).toBe('false'));

describe('GameDetailsDialog', () => {
  let dialog: GameDetailsDialog;
  let onClose: ReturnType<typeof vi.fn<() => void>>;
  let getGame: MockInstance<typeof gamesApi.getGame>;
  let getComments: MockInstance<typeof gamesApi.getComments>;

  beforeEach(() => {
    onClose = vi.fn<() => void>();
    getGame = vi.spyOn(gamesApi, 'getGame').mockResolvedValue(makeGameDetails({ name: 'Tiny Glade' }));
    getComments = vi.spyOn(gamesApi, 'getComments').mockResolvedValue(makeCommentsPage());
    vi.spyOn(snackbar, 'info');
    vi.spyOn(snackbar, 'error');
    dialog = new GameDetailsDialog({ onClose });
    dialog.mount(document.body);
  });

  afterEach(() => {
    dialog.destroy();
  });

  it('opens as a modal named by the game title once it has loaded', async () => {
    dialog.open('tiny-glade');
    expect(dialog.isOpen).toBe(true);
    expect(getGame).toHaveBeenCalledWith('tiny-glade', expect.any(AbortSignal));

    await loaded();
    const titleId = dialogElement().getAttribute('aria-labelledby') ?? '';
    expect(textOf(query(`#${titleId}`))).toBe('Tiny Glade');
  });

  it('asks for the 3 newest comments only after the game exists, and shows the total in the heading', async () => {
    dialog.open('tiny-glade');
    await loaded();

    expect(getComments).toHaveBeenCalledWith('tiny-glade', { limit: 3, sort: 'newest' }, expect.any(AbortSignal));
    expect(textOf(query('.comments__title'))).toBe('Comments (12)');
    expect(queryAll('.comments__list .comment')).toHaveLength(1);
  });

  it('shows the comment text decoded once and escaped, with a machine-readable date', async () => {
    getComments.mockResolvedValue(
      makeCommentsPage({
        comments: [makeComment({ text: '&lt;b&gt;Tom &amp; Jerry&lt;/b&gt;', createdAt: '2026-10-01T12:00:00.000Z' })],
      }),
    );
    dialog.open('tiny-glade');
    await loaded();

    expect(textOf(query('.comment__text'))).toBe('<b>Tom & Jerry</b>');
    expect(document.querySelector('.comment__text b')).toBeNull();
    expect(query('.comment__date').getAttribute('datetime')).toBe('2026-10-01T12:00:00.000Z');
  });

  it('says there are no comments yet for an empty list', async () => {
    getComments.mockResolvedValue(makeCommentsPage({ comments: [], total: 0 }));
    dialog.open('tiny-glade');
    await loaded();

    expect(textOf(query('.comments .empty-state__title'))).toBe('No comments yet');
    expect(textOf(query('.comments__title'))).toBe('Comments (0)');
  });

  it('shows the game info, specs and top records', async () => {
    dialog.open('tiny-glade');
    await loaded();

    expect(textOf(query('.game-info__description'))).toBe('A small diorama builder.');
    expect(queryAll('.game-info__spec')).not.toHaveLength(0);
    expect(textOf(query('.top-records__player'))).toContain('CozyGamer');
  });

  it('asks a guest to sign in for favorites, likes and comments', async () => {
    dialog.open('tiny-glade');
    await loaded();

    query('.game-info__action--favorite').click();
    query('.comment__like').click();
    query<HTMLFormElement>('.comment-form').dispatchEvent(new Event('submit', { cancelable: true }));

    expect(vi.mocked(snackbar.info).mock.calls.map(([text]) => text)).toEqual([
      'Sign in to add games to your favorites.',
      'Sign in to like comments.',
      'Sign in to leave a comment.',
    ]);
  });

  it('enables Send only when the comment has non-blank text', async () => {
    dialog.open('tiny-glade');
    await loaded();
    const input = query<HTMLTextAreaElement>('.comment-form__input');
    const send = query<HTMLButtonElement>('.comment-form__submit');

    input.value = ' '.repeat(3);
    input.dispatchEvent(new Event('input'));
    expect(send.disabled).toBe(true);

    input.value = 'Nice';
    input.dispatchEvent(new Event('input'));
    expect(send.disabled).toBe(false);
  });

  it('shows "Game Not Found" with a Close button for an unknown game, without an error toast', async () => {
    getGame.mockRejectedValue(new HttpError('not-found'));
    dialog.open('no-such-game');

    await vi.waitFor(() => expect(textOf(query('.game-details .empty-state__title'))).toBe('Game Not Found'));
    expect(snackbar.error).not.toHaveBeenCalled();

    query('.game-details .empty-state__action').click();
    expect(dialog.isOpen).toBe(false);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('is idempotent for the same game and swaps the content for another one', async () => {
    dialog.open('tiny-glade');
    dialog.open('tiny-glade');
    expect(getGame).toHaveBeenCalledOnce();

    dialog.open('heartopia');
    expect(getGame).toHaveBeenLastCalledWith('heartopia', expect.any(AbortSignal));
    expect(queryAll('.game-details__content')).toHaveLength(1);
  });

  it('closes with the ✕ button and clears its content afterwards', async () => {
    dialog.open('tiny-glade');
    await loaded();

    query('.game-details__close').click();

    expect(dialog.isOpen).toBe(false);
    expect(onClose).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(document.querySelector('.game-details__content')).toBeNull());
  });
});
