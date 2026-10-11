// @vitest-environment happy-dom
import { type MockInstance, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@app/core/http';
import { catalogApi, gamesApi } from '@app/services/api';
import type { GamesPage, GamesQuery } from '@shared/types/game';
import { snackbar } from '@shared/ui/snackbar';
import { installPopoverStub, query, queryAll, stubMatchMedia, textOf } from '@testing/dom';
import { makeCategory, makeGameSummary } from '@testing/fixtures';
import { LibraryPage } from './library.page';
import type { LibraryState } from './library-state';

const CATEGORIES = [
  makeCategory({ slug: 'all', label: 'All Games', isDefault: true }),
  makeCategory({ slug: 'puzzle', label: 'Puzzle' }),
];

function makePage(overrides: Partial<GamesPage> = {}): GamesPage {
  return { games: [makeGameSummary()], page: 1, totalPages: 3, totalItems: 13, ...overrides };
}

type Navigate = (state: LibraryState, options: { replace: boolean }) => void;

describe('LibraryPage', () => {
  let page: LibraryPage;
  let onNavigate: ReturnType<typeof vi.fn<Navigate>>;
  let onGameDetails: ReturnType<typeof vi.fn<(slug: string) => void>>;
  let getGames: MockInstance<typeof gamesApi.getGames>;

  function mount(query = ''): void {
    page = new LibraryPage({ initialQuery: new URLSearchParams(query), onGameDetails, onNavigate });
    page.mount(document.body);
  }

  const requested = (call = 0): GamesQuery => getGames.mock.calls[call][0];
  const settled = (): Promise<void> =>
    vi.waitFor(() => expect(onNavigate).toHaveBeenCalledWith(expect.anything(), { replace: true }));

  beforeEach(() => {
    installPopoverStub();
    stubMatchMedia(true);
    onNavigate = vi.fn<Navigate>();
    onGameDetails = vi.fn<(slug: string) => void>();
    vi.spyOn(catalogApi, 'getCategories').mockResolvedValue(CATEGORIES);
    getGames = vi.spyOn(gamesApi, 'getGames').mockResolvedValue(makePage());
    vi.spyOn(snackbar, 'warning');
    vi.spyOn(snackbar, 'error');
  });

  afterEach(() => {
    page.destroy();
  });

  it('asks the API for exactly the state in the URL, six cards a page', async () => {
    mount('category=puzzle&sort=name-asc&page=2');
    await settled();

    expect(requested()).toEqual({ category: 'puzzle', sort: 'name-asc', page: 2, limit: 6 });
    expect(queryAll('.library-card')).toHaveLength(1);
  });

  it('fills in the default category and writes the canonical URL without a new history entry', async () => {
    mount();
    await settled();

    expect(requested().category).toBe('all');
    expect(onNavigate).toHaveBeenCalledWith({ category: 'all', sort: 'rating-desc', page: 1 }, { replace: true });
    expect(query<HTMLInputElement>('.category-chips__input:checked').value).toBe('all');
  });

  it('falls back to all games for an unknown category, with a warning', async () => {
    mount('category=chess&sort=rating-desc&page=1');
    await settled();

    expect(requested().category).toBe('all');
    expect(snackbar.warning).toHaveBeenCalledWith(expect.stringContaining('"chess"'));
  });

  it('shows the last page instead of a page past the end, with a warning', async () => {
    getGames
      .mockResolvedValueOnce(makePage({ page: 9, totalPages: 3, games: [] }))
      .mockResolvedValueOnce(makePage({ page: 3 }));
    mount('category=all&sort=rating-desc&page=9');
    await settled();

    expect(requested(1).page).toBe(3);
    expect(snackbar.warning).toHaveBeenCalledWith("Page 9 doesn't exist — showing page 3.");
    expect(onNavigate).toHaveBeenCalledWith({ category: 'all', sort: 'rating-desc', page: 3 }, { replace: true });
  });

  it('turns a chip choice into a new URL from page 1 — the request comes only from the URL', async () => {
    mount('category=all&sort=rating-desc&page=2');
    await settled();
    getGames.mockClear();

    const puzzle = queryAll<HTMLInputElement>('.category-chips__input')[1];
    puzzle.checked = true;
    puzzle.dispatchEvent(new Event('change', { bubbles: true }));

    expect(onNavigate).toHaveBeenLastCalledWith({ category: 'puzzle', sort: 'rating-desc', page: 1 }, { replace: false });
    expect(getGames).not.toHaveBeenCalled();
  });

  it('turns a sort choice and a page click into new URLs', async () => {
    mount('category=all&sort=rating-desc&page=1');
    await settled();

    query('[data-value="name-asc"]').click();
    expect(onNavigate).toHaveBeenLastCalledWith({ category: 'all', sort: 'name-asc', page: 1 }, { replace: false });

    query('.pagination [data-page="2"]').click();
    expect(onNavigate).toHaveBeenLastCalledWith({ category: 'all', sort: 'rating-desc', page: 2 }, { replace: false });
  });

  it('loads a new state from the URL and ignores the same state again', async () => {
    mount('category=all&sort=rating-desc&page=1');
    await settled();

    page.onQueryChange(new URLSearchParams('category=all&sort=rating-desc&page=1'));
    expect(getGames).toHaveBeenCalledOnce();

    page.onQueryChange(new URLSearchParams('category=puzzle&sort=rating-desc&page=1'));
    await vi.waitFor(() => expect(getGames).toHaveBeenCalledTimes(2));
    expect(requested(1).category).toBe('puzzle');
  });

  it('warns about invalid URL parameters it had to fix', async () => {
    mount('category=all&sort=sideways&page=1');
    await settled();

    expect(snackbar.warning).toHaveBeenCalled();
    expect(requested().sort).toBe('rating-desc');
  });

  it('shows "Data Not Found" for an empty category, pagination as a single page', async () => {
    getGames.mockResolvedValue(makePage({ games: [], totalPages: 0, totalItems: 0 }));
    mount('category=puzzle&sort=rating-desc&page=1');
    await settled();

    expect(textOf(query('.empty-state__title'))).toBe('Data Not Found');
    expect(query('.pagination').hidden).toBe(false);
    expect(queryAll('.pagination__page')).toHaveLength(1);
  });

  it('shows the error banner and hides the pagination when the games request fails', async () => {
    getGames.mockRejectedValue(new HttpError('network'));
    mount('category=all&sort=rating-desc&page=1');

    await vi.waitFor(() => expect(document.querySelector('.error-banner')).not.toBeNull());
    expect(query('.pagination').hidden).toBe(true);
  });

  it('shows no chips when the categories cannot be loaded', async () => {
    vi.mocked(catalogApi.getCategories).mockRejectedValue(new HttpError('server'));
    mount();

    await vi.waitFor(() => expect(document.querySelector('.error-banner')).not.toBeNull());
    expect(queryAll('.category-chips__input')).toHaveLength(0);
    expect(getGames).not.toHaveBeenCalled();
  });

  it('opens the details of a card', async () => {
    mount('category=all&sort=rating-desc&page=1');
    await settled();

    query('.library-card__details').click();

    expect(onGameDetails).toHaveBeenCalledWith('tiny-glade');
  });
});
