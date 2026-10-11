// @vitest-environment happy-dom
import { type MockInstance, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@app/core/http';
import { gamesApi } from '@app/services/api';
import type { CommentsPage } from '@shared/types/game-details';
import { snackbar } from '@shared/ui/snackbar';
import { query, queryAll, textOf } from '@testing/dom';
import { makeComment, makeGameDetails } from '@testing/fixtures';
import { createFakeSessionSource, makeAppSession, type FakeSessionSource } from '@testing/session';
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
  let session: FakeSessionSource;
  let requestAuth: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    onClose = vi.fn<() => void>();
    getGame = vi.spyOn(gamesApi, 'getGame').mockResolvedValue(makeGameDetails({ name: 'Tiny Glade' }));
    getComments = vi.spyOn(gamesApi, 'getComments').mockResolvedValue(makeCommentsPage());
    vi.spyOn(snackbar, 'info');
    vi.spyOn(snackbar, 'warning');
    vi.spyOn(snackbar, 'success');
    vi.spyOn(snackbar, 'error');
    session = createFakeSessionSource();
    requestAuth = vi.fn<() => void>();
    dialog = new GameDetailsDialog({ onClose, access: { session, requestAuth } });
    dialog.mount(document.body);
  });

  afterEach(() => {
    dialog.destroy();
  });

  it('opens as a modal named by the game title once it has loaded', async () => {
    dialog.open('tiny-glade');
    expect(dialog.isOpen).toBe(true);
    expect(getGame).toHaveBeenCalledWith('tiny-glade', { userEmail: undefined }, expect.any(AbortSignal));

    await loaded();
    const titleId = dialogElement().getAttribute('aria-labelledby') ?? '';
    expect(textOf(query(`#${titleId}`))).toBe('Tiny Glade');
  });

  it('asks for the game with the email of the signed-in user (personal favorite state)', () => {
    session.emit(makeAppSession({ email: 'alex+test@rs.school' }), 'signed-in');

    dialog.open('tiny-glade');

    expect(getGame).toHaveBeenCalledWith('tiny-glade', { userEmail: 'alex+test@rs.school' }, expect.any(AbortSignal));
  });

  it('asks for the 3 newest comments only after the game exists, and shows the total in the heading', async () => {
    dialog.open('tiny-glade');
    await loaded();

    expect(getComments).toHaveBeenCalledWith(
      'tiny-glade',
      { limit: 3, sort: 'newest', userEmail: undefined },
      expect.any(AbortSignal),
    );
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

  it('gives each commenter a random token color and the uppercase first letter, kept when the list reloads', async () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    session.emit(makeAppSession(), 'signed-in');
    vi.spyOn(gamesApi, 'postComment').mockResolvedValue(makeComment());
    getComments.mockResolvedValue(makeCommentsPage({ comments: [makeComment({ authorName: ' cozyGamer' })] }));
    dialog.open('tiny-glade');
    await loaded();

    const avatar = (): HTMLElement => query('.comment__avatar');
    expect(avatar().classList.contains('comment__avatar--3')).toBe(true);
    expect(textOf(avatar())).toBe('C');

    random.mockReturnValue(0);
    const input = query<HTMLTextAreaElement>('.comment-form__input');
    input.value = 'Hi';
    input.dispatchEvent(new Event('input'));
    query<HTMLFormElement>('.comment-form').dispatchEvent(new Event('submit', { cancelable: true }));
    await vi.waitFor(() => expect(getComments).toHaveBeenCalledTimes(2));
    await loaded();

    expect(avatar().classList.contains('comment__avatar--3')).toBe(true);
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

  it('opens Auth over the game for a guest favorite, explains likes, and locks the comment form', async () => {
    dialog.open('tiny-glade');
    await loaded();

    query('.game-info__action--favorite').click();
    query('.comment__like').click();

    expect(requestAuth).toHaveBeenCalledOnce();
    expect(vi.mocked(snackbar.info).mock.calls.map(([text]) => text)).toEqual(['Sign in to like comments.']);
    expect(query<HTMLTextAreaElement>('.comment-form__input').disabled).toBe(true);
  });

  it('asks for the comments with the signed-in user email and reloads them after a comment is posted', async () => {
    session.emit(makeAppSession({ email: 'mia@rs.school' }), 'signed-in');
    vi.spyOn(gamesApi, 'postComment').mockResolvedValue(makeComment());
    dialog.open('tiny-glade');
    await loaded();
    expect(getComments).toHaveBeenLastCalledWith(
      'tiny-glade',
      { limit: 3, sort: 'newest', userEmail: 'mia@rs.school' },
      expect.any(AbortSignal),
    );

    getComments.mockResolvedValue(makeCommentsPage({ total: 13 }));
    const input = query<HTMLTextAreaElement>('.comment-form__input');
    input.value = 'Lovely';
    input.dispatchEvent(new Event('input'));
    query<HTMLFormElement>('.comment-form').dispatchEvent(new Event('submit', { cancelable: true }));

    await vi.waitFor(() => expect(textOf(query('.comments__title'))).toBe('Comments (13)'));
    expect(getComments).toHaveBeenCalledTimes(2);
  });

  it('updates the favorites count next to the rating from the toggle answer', async () => {
    session.emit(makeAppSession(), 'signed-in');
    vi.spyOn(gamesApi, 'toggleFavorite').mockResolvedValue({
      gameSlug: 'tiny-glade',
      isFavorited: true,
      likesCount: 31_201,
    });
    dialog.open('tiny-glade');
    await loaded();

    query('.game-info__action--favorite').click();

    await vi.waitFor(() => expect(textOf(query('.game-info__likes-count'))).toBe('31.2K'));
  });

  it('enables Send only when the comment has non-blank text', async () => {
    session.emit(makeAppSession(), 'signed-in');
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
    expect(getGame).toHaveBeenLastCalledWith('heartopia', { userEmail: undefined }, expect.any(AbortSignal));
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

  describe('suspended under Auth', () => {
    it('steps aside without reporting a close, and comes back as it was — no new request, the draft kept', async () => {
      dialog.open('tiny-glade');
      await loaded();
      const input = query<HTMLTextAreaElement>('.comment-form__input');
      input.value = 'Half-written comment';

      dialog.suspend('tiny-glade');
      expect(dialog.isOpen).toBe(false);
      await vi.waitFor(() => expect(onClose).not.toHaveBeenCalled());

      dialog.open('tiny-glade');
      expect(dialog.isOpen).toBe(true);
      expect(getGame).toHaveBeenCalledOnce();
      expect(query<HTMLTextAreaElement>('.comment-form__input')).toBe(input);
      expect(input.value).toBe('Half-written comment');
    });

    it('keeps its content after the close animations while suspended', async () => {
      dialog.open('tiny-glade');
      await loaded();

      dialog.suspend('tiny-glade');
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(document.querySelector('.game-details__content')).not.toBeNull();
    });

    it('starts loading a deep-linked game hidden, ready for when Auth closes', () => {
      dialog.suspend('heartopia');

      expect(dialog.isOpen).toBe(false);
      expect(getGame).toHaveBeenCalledWith('heartopia', { userEmail: undefined }, expect.any(AbortSignal));
      expect(document.querySelector('.game-details__content')).not.toBeNull();
    });

    it('loads another game when the URL changed to it in the meantime', () => {
      dialog.suspend('heartopia');

      dialog.open('tiny-glade');

      expect(getGame).toHaveBeenLastCalledWith('tiny-glade', { userEmail: undefined }, expect.any(AbortSignal));
      expect(getGame).toHaveBeenCalledTimes(2);
    });

    it('drops the suspended content when the URL no longer names the game', () => {
      dialog.suspend('heartopia');

      dialog.close();

      expect(document.querySelector('.game-details__content')).toBeNull();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('a normal open after a full close starts from scratch (a new request)', async () => {
      dialog.open('tiny-glade');
      await loaded();
      dialog.close();
      await vi.waitFor(() => expect(document.querySelector('.game-details__content')).toBeNull());

      dialog.open('tiny-glade');

      expect(getGame).toHaveBeenCalledTimes(2);
    });
  });
});
