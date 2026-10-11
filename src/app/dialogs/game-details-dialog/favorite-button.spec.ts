// @vitest-environment happy-dom
import { type MockInstance, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@app/core/http';
import { gamesApi } from '@app/services/api';
import type { FavoriteState } from '@shared/types/game-details';
import { snackbar } from '@shared/ui/snackbar';
import { query, textOf } from '@testing/dom';
import { makeGameDetails } from '@testing/fixtures';
import { createFakeSessionSource, makeAppSession, type FakeSessionSource } from '@testing/session';
import { FAVORITE_MESSAGES, FavoriteButton } from './favorite-button';

const EMAIL = 'john@minigames.com';
const SLUG = 'tukoni-forest-keepers';

function defer<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

const button = (): HTMLButtonElement => query<HTMLButtonElement>('.game-info__action--favorite');
const label = (): string => textOf(query('.game-info__favorite-label'));
const isActive = (): boolean => button().classList.contains('game-info__action--favorite-active');
const isLocked = (): boolean => button().disabled && button().classList.contains('game-info__action--pending');

describe('FavoriteButton', () => {
  let session: FakeSessionSource;
  let requestAuth: ReturnType<typeof vi.fn<() => void>>;
  let onLikesCount: ReturnType<typeof vi.fn<(count: number) => void>>;
  let toggleFavorite: MockInstance<typeof gamesApi.toggleFavorite>;
  let getGame: MockInstance<typeof gamesApi.getGame>;
  let favorite: FavoriteButton;

  function mount({ isFavorited = false, loadedFor = EMAIL as string | null } = {}): void {
    favorite = new FavoriteButton({ slug: SLUG, isFavorited, loadedFor, access: { session, requestAuth }, onLikesCount });
    favorite.mount(document.body);
  }

  const signedIn = (): FakeSessionSource => createFakeSessionSource(makeAppSession({ email: EMAIL }));

  beforeEach(() => {
    session = signedIn();
    requestAuth = vi.fn<() => void>();
    onLikesCount = vi.fn<(count: number) => void>();
    toggleFavorite = vi.spyOn(gamesApi, 'toggleFavorite');
    getGame = vi.spyOn(gamesApi, 'getGame');
    for (const method of ['success', 'error', 'warning', 'info'] as const) vi.spyOn(snackbar, method);
  });

  afterEach(() => {
    favorite.destroy();
  });

  describe('guest', () => {
    beforeEach(() => {
      session = createFakeSessionSource();
    });

    it('shows "Add to Favorites" whatever the game answer said', () => {
      mount({ isFavorited: true, loadedFor: null });

      expect(label()).toBe('Add to Favorites');
      expect(isActive()).toBe(false);
    });

    it('sends nothing: a warning and Auth over the game instead', () => {
      mount({ loadedFor: null });

      button().click();

      expect(toggleFavorite).not.toHaveBeenCalled();
      expect(snackbar.warning).toHaveBeenCalledExactlyOnceWith(FAVORITE_MESSAGES.signIn);
      expect(requestAuth).toHaveBeenCalledOnce();
    });
  });

  it('a session that has just run out: no request, Auth, and no second toast next to the expiration one', () => {
    mount();
    session.expireSilently();

    button().click();

    expect(toggleFavorite).not.toHaveBeenCalled();
    expect(requestAuth).toHaveBeenCalledOnce();
    expect(snackbar.warning).not.toHaveBeenCalled();
    expect(label()).toBe('Add to Favorites');
  });

  it('starts from the personal game answer', () => {
    mount({ isFavorited: true });

    expect(label()).toBe('Remove from Favorites');
    expect(isActive()).toBe(true);
  });

  it('locks with a spinner while the toggle is out, then shows the server state and count', async () => {
    const request = defer<FavoriteState>();
    toggleFavorite.mockReturnValue(request.promise);
    mount();

    button().click();
    expect(toggleFavorite).toHaveBeenCalledWith(SLUG, EMAIL, expect.any(AbortSignal));
    expect(isLocked()).toBe(true);
    expect(button().getAttribute('aria-busy')).toBe('true');

    request.resolve({ gameSlug: SLUG, isFavorited: true, likesCount: 31_201 });
    await vi.waitFor(() => expect(isLocked()).toBe(false));

    expect(label()).toBe('Remove from Favorites');
    expect(onLikesCount).toHaveBeenCalledWith(31_201);
    expect(snackbar.success).toHaveBeenCalledWith(FAVORITE_MESSAGES.added);
  });

  it('takes the server answer even when it differs from a simple flip', async () => {
    toggleFavorite.mockResolvedValue({ gameSlug: SLUG, isFavorited: false, likesCount: 7 });
    mount({ isFavorited: false });

    button().click();
    await vi.waitFor(() => expect(isLocked()).toBe(false));

    expect(label()).toBe('Add to Favorites');
    expect(snackbar.success).toHaveBeenCalledWith(FAVORITE_MESSAGES.removed);
  });

  it('never sends a second toggle while the first is out', () => {
    toggleFavorite.mockReturnValue(defer<FavoriteState>().promise);
    mount();

    button().click();
    // Even if the lock is lifted by hand (DevTools), the pending request is still the only one
    button().disabled = false;
    button().click();

    expect(toggleFavorite).toHaveBeenCalledOnce();
  });

  it('rejected (429): the server message, the state unchanged, the button free again — no check request', async () => {
    toggleFavorite.mockRejectedValue(
      new HttpError('rate-limit', { message: 'Rate limit exceeded. Try again in 42 seconds' }),
    );
    mount({ isFavorited: true });

    button().click();
    await vi.waitFor(() => expect(isLocked()).toBe(false));

    expect(snackbar.error).toHaveBeenCalledWith(FAVORITE_MESSAGES.rejected('Rate limit exceeded. Try again in 42 seconds'));
    expect(label()).toBe('Remove from Favorites');
    expect(getGame).not.toHaveBeenCalled();
  });

  it('unknown outcome (lost connection): not repeated — a warning and the real state from a GET', async () => {
    toggleFavorite.mockRejectedValue(new HttpError('network'));
    getGame.mockResolvedValue(makeGameDetails({ isLikedByCurrentUser: true, likesCount: 42 }));
    mount({ isFavorited: false });

    button().click();
    await vi.waitFor(() => expect(isLocked()).toBe(false));

    expect(toggleFavorite).toHaveBeenCalledOnce();
    expect(snackbar.warning).toHaveBeenCalledWith(FAVORITE_MESSAGES.unknown);
    expect(getGame).toHaveBeenCalledWith(SLUG, { userEmail: EMAIL }, expect.any(AbortSignal));
    expect(label()).toBe('Remove from Favorites');
    expect(onLikesCount).toHaveBeenCalledWith(42);
  });

  it('unknown outcome and the check fails too: says so, keeps the last known state', async () => {
    toggleFavorite.mockRejectedValue(new HttpError('timeout'));
    getGame.mockRejectedValue(new HttpError('network'));
    mount({ isFavorited: false });

    button().click();
    await vi.waitFor(() => expect(isLocked()).toBe(false));

    expect(snackbar.error).toHaveBeenCalledWith(FAVORITE_MESSAGES.loadFailed(new HttpError('network').message));
    expect(label()).toBe('Add to Favorites');
  });

  it('puts the focus back on the button after the request (a disabled button drops it)', async () => {
    toggleFavorite.mockResolvedValue({ gameSlug: SLUG, isFavorited: true, likesCount: 1 });
    mount();
    button().focus();

    button().click();
    // What Chrome does to a focused button that becomes disabled: the focus falls back to <body>
    const elsewhere = document.createElement('button');
    document.body.append(elsewhere);
    elsewhere.focus();
    elsewhere.remove();
    expect(document.activeElement).toBe(document.body);
    await vi.waitFor(() => expect(isLocked()).toBe(false));

    expect(document.activeElement).toBe(button());
  });

  describe('when the session changes while the game is open', () => {
    it('signed in (e.g. through Auth over the game): reloads the state for that user, locked meanwhile', async () => {
      session = createFakeSessionSource();
      const game = defer<ReturnType<typeof makeGameDetails>>();
      getGame.mockReturnValue(game.promise);
      mount({ isFavorited: false, loadedFor: null });

      session.emit(makeAppSession({ email: EMAIL }), 'signed-in');
      expect(getGame).toHaveBeenCalledWith(SLUG, { userEmail: EMAIL }, expect.any(AbortSignal));
      expect(isLocked()).toBe(true);

      game.resolve(makeGameDetails({ isLikedByCurrentUser: true, likesCount: 9 }));
      await vi.waitFor(() => expect(isLocked()).toBe(false));
      expect(label()).toBe('Remove from Favorites');
      expect(onLikesCount).toHaveBeenCalledWith(9);
    });

    it('does not reload for the user whose state is already shown', () => {
      mount();

      session.emit(makeAppSession({ email: EMAIL }), 'synced');

      expect(getGame).not.toHaveBeenCalled();
    });

    it('signed out or expired: back to the guest state at once, and a late toggle answer is ignored', async () => {
      const request = defer<FavoriteState>();
      toggleFavorite.mockReturnValue(request.promise);
      mount({ isFavorited: true });
      button().click();

      session.emit(null, 'expired');
      expect(label()).toBe('Add to Favorites');
      expect(isLocked()).toBe(false);

      request.resolve({ gameSlug: SLUG, isFavorited: true, likesCount: 5 });
      await request.promise;
      await Promise.resolve();
      expect(label()).toBe('Add to Favorites');
      expect(onLikesCount).not.toHaveBeenCalled();
      expect(snackbar.success).not.toHaveBeenCalled();
    });
  });

  it('stays silent when the dialog is closed while the request is out (the request is aborted)', async () => {
    toggleFavorite.mockImplementation(
      (_slug, _email, signal) =>
        new Promise((_resolve, reject) => {
          signal?.addEventListener('abort', () => reject(new HttpError('aborted')));
        }),
    );
    mount();
    button().click();

    favorite.destroy();
    await Promise.resolve();

    expect(snackbar.error).not.toHaveBeenCalled();
    expect(snackbar.warning).not.toHaveBeenCalled();
  });
});
