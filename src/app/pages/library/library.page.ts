import { ComponentBase } from '@app/core/component.base';
import { HttpError } from '@app/core/http';
import { catalogApi, gamesApi } from '@app/services/api';
import { AsyncContent } from '@shared/ui/async-content';
import { EmptyState } from '@shared/ui/empty-state';
import { snackbar } from '@shared/ui/snackbar';
import type { Category, GamesPage } from '@shared/types/game';
import { FilterSortBar } from './components/filter-sort-bar';
import { GameCardsSection, renderGameCardsSkeleton } from './components/game-cards-section';
import { Pagination } from './components/pagination';
import { LIBRARY_PAGE_SIZE, SORT_OPTIONS } from './library.constants';
import { INITIAL_LIBRARY_STATE, type LibraryState, isSameLibraryState, resolveCategory } from './library-state';
import './library.page.scss';

interface LibraryPageOptions {
  onGameDetails: (slug: string) => void;
}

/**
 * Container component: owns LibraryState, turns it into ONE games request and pushes the result
 * down to the presentational parts (chips, sort, cards, pagination).
 *
 *   control → requestState(patch) → applyState(state) → GET /games → cards + pagination from meta
 *
 * Branch spa-router: requestState() goes to the URL instead, and the router calls applyState().
 */
export class LibraryPage extends ComponentBase {
  private readonly options: LibraryPageOptions;
  private state: LibraryState = INITIAL_LIBRARY_STATE;
  private hasRequested = false;
  private categories: readonly Category[] = [];

  private filterBar: FilterSortBar | null = null;
  private results: HTMLElement | null = null;
  private gamesArea: AsyncContent<GamesPage> | null = null;
  private pagination: Pagination | null = null;

  constructor(options: LibraryPageOptions) {
    super();
    this.options = options;
  }

  mount(parent: HTMLElement): void {
    super.mount(parent);
    this.load();
  }

  /** The one way in for a new state. The same state again is a no-op — no duplicate requests. */
  applyState(next: LibraryState): void {
    if (this.hasRequested && isSameLibraryState(next, this.state)) return;

    this.state = next;
    if (next.category !== undefined) this.filterBar?.sync(next.category, next.sort);
    this.load();
  }

  protected render(): HTMLElement {
    const page = document.createElement('div');
    page.classList.add('library-page');

    page.innerHTML = `
      <section class="library" aria-labelledby="library-title">
        <div class="library__intro">
          <h1 id="library-title" class="library__title">Game Library</h1>
          <p class="library__subtitle">Browse our collection of casual mini-games</p>
        </div>
        <div class="library__results"></div>
      </section>
    `;

    const section = page.querySelector<HTMLElement>('.library');
    this.results = page.querySelector<HTMLElement>('.library__results');
    if (!section || !this.results) return page;

    this.filterBar = new FilterSortBar({
      sortOptions: SORT_OPTIONS,
      selectedSort: this.state.sort,
      onCategoryChange: (category) => this.requestState({ category }),
      onSortChange: (sort) => this.requestState({ sort }),
    });
    this.mountChild(this.filterBar, section);
    // The bar must stand above the results — mountChild appends, so move the results after it
    section.append(this.results);

    this.gamesArea = this.mountChild(
      new AsyncContent<GamesPage>({
        label: 'games',
        isEmpty: ({ games }) => games.length === 0,
        renderSkeleton: () => renderGameCardsSkeleton(LIBRARY_PAGE_SIZE),
        renderContent: ({ games }) =>
          new GameCardsSection({ games, categories: this.categories, onDetailsClick: this.options.onGameDetails }),
        renderEmpty: () =>
          new EmptyState({ title: 'Data Not Found', message: 'There are no games here yet. Try another category.' }),
        onStateChange: (state) => {
          if (state.status === 'success' || state.status === 'empty') {
            const { page: currentPage, totalPages } = state.data;
            this.pagination?.setState({ currentPage, totalPages });
            this.pagination?.setVisible(true);
          }
          // No metadata to build it from
          if (state.status === 'error') this.pagination?.setVisible(false);
        },
      }),
      this.results,
    );

    this.pagination = this.mountChild(
      new Pagination({
        onPageChange: (pageNumber) => {
          this.requestState({ page: pageNumber });
          this.scrollResultsIntoView();
        },
      }),
      section,
    );

    return page;
  }

  /**
   * A user action. 3-2-4: a new category or sort starts again from page 1.
   * Branch spa-router: this becomes "navigate to the URL of this state".
   */
  private requestState(patch: Partial<LibraryState>): void {
    const resetsPage = patch.category !== undefined || patch.sort !== undefined;
    this.applyState({ ...this.state, ...patch, ...(resetsPage ? { page: 1 } : {}) });
  }

  private load(): void {
    this.hasRequested = true;
    const requested = this.state;
    void this.gamesArea?.load((signal) => this.fetchGames(requested, signal));
  }

  /**
   * One "request" for the area = categories (cached after the first time) + games.
   * Invalid input is fixed here, with a warning, instead of being sent to the API:
   * an unknown category → default; a page past the end → the last page.
   */
  private async fetchGames(requested: LibraryState, signal: AbortSignal): Promise<GamesPage> {
    const categories = await this.loadCategories();
    throwIfAborted(signal);

    const category = resolveCategory(requested.category, categories);
    if (category.isFallback) {
      snackbar.warning(`Category "${requested.category ?? ''}" doesn't exist — showing all games.`);
    }

    let resolved: LibraryState = { ...requested, category: category.slug };
    let result = await gamesApi.getGames({ ...resolved, category: category.slug, limit: LIBRARY_PAGE_SIZE }, signal);

    if (result.totalPages > 0 && result.page > result.totalPages) {
      snackbar.warning(`Page ${result.page} doesn't exist — showing page ${result.totalPages}.`);
      resolved = { ...resolved, page: result.totalPages };
      result = await gamesApi.getGames({ ...resolved, category: category.slug, limit: LIBRARY_PAGE_SIZE }, signal);
    }

    throwIfAborted(signal);
    this.commitResolvedState(resolved);
    return result;
  }

  private async loadCategories(): Promise<readonly Category[]> {
    try {
      const categories = await catalogApi.getCategories();
      if (categories !== this.categories) {
        this.categories = categories;
        this.filterBar?.setCategories(categories, resolveCategory(this.state.category, categories).slug);
      }
      return categories;
    } catch (error) {
      this.filterBar?.clearCategories();
      throw error;
    }
  }

  /** Normalisation is not a user action: it replaces the state silently (spa-router: history.replaceState) */
  private commitResolvedState(resolved: LibraryState): void {
    this.state = resolved;
    if (resolved.category !== undefined) this.filterBar?.sync(resolved.category, resolved.sort);
  }

  /** After a page click at the bottom, bring the top of the new list into view */
  private scrollResultsIntoView(): void {
    if (this.results && this.results.getBoundingClientRect().top < 0) {
      this.results.scrollIntoView({ block: 'start' });
    }
  }
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw new HttpError('aborted');
}
