import { ComponentBase } from '@app/core/component.base';
import { LIBRARY_GAMES_MOCK, LIBRARY_TOTAL_GAMES_MOCK } from '@app/services/mock-data/games.mock';
import type { SortValue } from '@shared/types/game';
import { FilterSortBar } from './components/filter-sort-bar';
import { GameCardsSection } from './components/game-cards-section';
import { Pagination } from './components/pagination';
import { CATEGORIES, DEFAULT_CATEGORY, DEFAULT_SORT, LIBRARY_PAGE_SIZE, SORT_OPTIONS } from './library.constants';
import './library.page.scss';

interface LibraryPageOptions {
  onGameDetails: (slug: string) => void;
}

interface LibraryState {
  category: string;
  sort: SortValue;
  page: number;
}

export class LibraryPage extends ComponentBase {
  private options: LibraryPageOptions;
  private state: LibraryState = { category: DEFAULT_CATEGORY, sort: DEFAULT_SORT, page: 1 };

  constructor(options: LibraryPageOptions) {
    super();
    this.options = options;
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
      </section>
    `;

    const section = page.querySelector<HTMLElement>('.library');

    if (section) {
      this.mountChild(
        new FilterSortBar({
          categories: CATEGORIES,
          selectedCategory: this.state.category,
          sortOptions: SORT_OPTIONS,
          selectedSort: this.state.sort,
          onCategoryChange: (category) => this.setState({ category }),
          onSortChange: (sort) => this.setState({ sort }),
        }),
        section,
      );

      this.mountChild(
        new GameCardsSection({
          games: LIBRARY_GAMES_MOCK,
          categories: CATEGORIES,
          onDetailsClick: (slug) => this.options.onGameDetails(slug),
        }),
        section,
      );

      this.mountChild(
        new Pagination({
          totalPages: Math.ceil(LIBRARY_TOTAL_GAMES_MOCK / LIBRARY_PAGE_SIZE),
          currentPage: this.state.page,
          onPageChange: (pageNumber) => this.setState({ page: pageNumber }),
        }),
        section,
      );
    }

    return page;
  }

  private setState(patch: Partial<LibraryState>): void {
    this.state = { ...this.state, ...patch };
  }
}
