import { ComponentBase } from '@app/core/component.base';
import type { Category, SortOption, SortValue } from '@shared/types/game';
import { CategoryChips, renderCategoryChipsSkeleton } from './category-chips';
import { SortDropdown } from './sort-dropdown';
import './filter-sort-bar.scss';

interface FilterSortBarOptions {
  sortOptions: readonly SortOption[];
  selectedSort: SortValue;
  onCategoryChange: (slug: string) => void;
  onSortChange: (value: SortValue) => void;
}

/**
 * Layout container: categories (from the API) + sort (client constants).
 * The controls don't keep their own truth — the page pushes its state in with sync().
 */
export class FilterSortBar extends ComponentBase {
  private readonly options: FilterSortBarOptions;
  private categoriesHost: HTMLElement | null = null;
  private chips: CategoryChips | null = null;
  private categories: readonly Category[] | null = null;
  private dropdown: SortDropdown | null = null;

  constructor(options: FilterSortBarOptions) {
    super();
    this.options = options;
  }

  /** Called once the categories have arrived; the same list again (cached) is a no-op */
  setCategories(categories: readonly Category[], selected: string): void {
    if (!this.categoriesHost || this.categories === categories) return;

    this.categories = categories;
    if (this.chips) this.destroyChild(this.chips);
    this.categoriesHost.replaceChildren();
    this.chips = this.mountChild(
      new CategoryChips({ categories, selected, onChange: this.options.onCategoryChange }),
      this.categoriesHost,
    );
  }

  /** The request for categories failed: no fake chips (the games area shows the error banner) */
  clearCategories(): void {
    if (this.chips) this.destroyChild(this.chips);
    this.chips = null;
    this.categories = null;
    this.categoriesHost?.replaceChildren();
  }

  sync(category: string, sort: SortValue): void {
    this.chips?.select(category);
    this.dropdown?.setValue(sort);
  }

  protected render(): HTMLElement {
    const bar = document.createElement('div');
    bar.classList.add('filter-sort-bar');
    bar.innerHTML = '<div class="filter-sort-bar__categories"></div>';

    this.categoriesHost = bar.querySelector<HTMLElement>('.filter-sort-bar__categories');
    if (this.categoriesHost) {
      const skeleton = renderCategoryChipsSkeleton();
      skeleton.inert = true;
      this.categoriesHost.append(skeleton);
    }

    const { sortOptions, selectedSort, onSortChange } = this.options;
    this.dropdown = this.mountChild(
      new SortDropdown({ id: 'library-sort', options: sortOptions, selected: selectedSort, onChange: onSortChange }),
      bar,
    );

    return bar;
  }
}
