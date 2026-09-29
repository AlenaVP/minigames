import { ComponentBase } from '@app/core/component.base';
import { LIBRARY_GAMES_MOCK } from '@app/services/mock-data/games.mock';
import type { SortValue } from '@shared/types/game';
import { FilterSortBar } from './components/filter-sort-bar';
import { GameCardsSection } from './components/game-cards-section';
import { CATEGORIES, DEFAULT_CATEGORY, DEFAULT_SORT, SORT_OPTIONS } from './library.constants';
import './library.page.scss';

interface LibraryPageOptions {
  onGameDetails: (slug: string) => void;
}

interface LibraryState {
  category: string;
  sort: SortValue;
}

export class LibraryPage extends ComponentBase {
  private options: LibraryPageOptions;
  // Single source of truth for the page. Story 3: state → API query; Story 4: state ↔ URL
  private state: LibraryState = { category: DEFAULT_CATEGORY, sort: DEFAULT_SORT };

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
    }

    return page;
  }

  private setState(patch: Partial<LibraryState>): void {
    this.state = { ...this.state, ...patch };
    // Story 2: nothing else happens on purpose (the task forbids real filtering/sorting yet)
  }
}
