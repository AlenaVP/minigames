import { ComponentBase } from '@app/core/component.base';
import type { Category, SortOption, SortValue } from '@shared/types/game';
import { CategoryChips } from './category-chips';
import { SortDropdown } from './sort-dropdown';
import './filter-sort-bar.scss';

interface FilterSortBarOptions {
  categories: readonly Category[];
  selectedCategory: string;
  sortOptions: readonly SortOption[];
  selectedSort: SortValue;
  onCategoryChange: (slug: string) => void;
  onSortChange: (value: SortValue) => void;
}

/** Layout container only: the controls themselves know nothing about each other */
export class FilterSortBar extends ComponentBase {
  private options: FilterSortBarOptions;

  constructor(options: FilterSortBarOptions) {
    super();
    this.options = options;
  }

  protected render(): HTMLElement {
    const bar = document.createElement('div');
    bar.classList.add('filter-sort-bar');

    const { categories, selectedCategory, sortOptions, selectedSort, onCategoryChange, onSortChange } = this.options;

    this.mountChild(new CategoryChips({ categories, selected: selectedCategory, onChange: onCategoryChange }), bar);
    this.mountChild(
      new SortDropdown({ id: 'library-sort', options: sortOptions, selected: selectedSort, onChange: onSortChange }),
      bar,
    );

    return bar;
  }
}
