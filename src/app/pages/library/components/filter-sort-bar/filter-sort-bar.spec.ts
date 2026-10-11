// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SortValue } from '@shared/types/game';
import { installPopoverStub, query, queryAll } from '@testing/dom';
import { makeCategory } from '@testing/fixtures';
import { SORT_OPTIONS } from '../../library.constants';
import { FilterSortBar } from '.';

const CATEGORIES = [
  makeCategory({ slug: 'all', label: 'All Games', isDefault: true }),
  makeCategory({ slug: 'puzzle', label: 'Puzzle' }),
  makeCategory({ slug: 'card', label: 'Card <b>' }),
];

const chips = (): HTMLInputElement[] => queryAll<HTMLInputElement>('.category-chips__input');
const checked = (): string[] =>
  chips()
    .filter((input) => input.checked)
    .map((input) => input.value);

describe('FilterSortBar', () => {
  let bar: FilterSortBar;
  let onCategoryChange: ReturnType<typeof vi.fn<(slug: string) => void>>;
  let onSortChange: ReturnType<typeof vi.fn<(value: SortValue) => void>>;

  beforeEach(() => {
    installPopoverStub();
    onCategoryChange = vi.fn<(slug: string) => void>();
    onSortChange = vi.fn<(value: SortValue) => void>();
    bar = new FilterSortBar({ sortOptions: SORT_OPTIONS, selectedSort: 'rating-desc', onCategoryChange, onSortChange });
    bar.mount(document.body);
  });

  afterEach(() => {
    bar.destroy();
  });

  it('shows inert chip placeholders until the categories arrive', () => {
    expect(queryAll('.category-chips__chip--skeleton')).toHaveLength(7);
    expect(query('.filter-sort-bar__categories > .category-chips').inert).toBe(true);
  });

  it('renders the categories as a radio group with the selected one checked, labels as text', () => {
    bar.setCategories(CATEGORIES, 'puzzle');

    expect(chips().map((input) => input.value)).toEqual(['all', 'puzzle', 'card']);
    expect(checked()).toEqual(['puzzle']);
    expect(query('legend').textContent).toBe('Filter games by category');
    expect(document.querySelector('.category-chips b')).toBeNull();
    expect(queryAll('.category-chips__chip--skeleton')).toHaveLength(0);
  });

  it('reports the category the user picks', () => {
    bar.setCategories(CATEGORIES, 'all');

    const card = chips()[2];
    card.checked = true;
    card.dispatchEvent(new Event('change', { bubbles: true }));

    expect(onCategoryChange).toHaveBeenCalledWith('card');
  });

  it('does not rebuild the chips for the same (cached) list', () => {
    bar.setCategories(CATEGORIES, 'all');
    const first = query('.category-chips');

    bar.setCategories(CATEGORIES, 'puzzle');

    expect(query('.category-chips')).toBe(first);
  });

  it('syncs both controls from the page state without reporting back', () => {
    bar.setCategories(CATEGORIES, 'all');

    bar.sync('card', 'name-asc');

    expect(checked()).toEqual(['card']);
    expect(query('[data-value="name-asc"]').getAttribute('aria-selected')).toBe('true');
    expect(onCategoryChange).not.toHaveBeenCalled();
    expect(onSortChange).not.toHaveBeenCalled();
  });

  it('removes the chips when the categories could not be loaded', () => {
    bar.setCategories(CATEGORIES, 'all');

    bar.clearCategories();

    expect(chips()).toHaveLength(0);
  });

  it('reports a sort change from the dropdown', () => {
    query('[data-value="name-desc"]').click();

    expect(onSortChange).toHaveBeenCalledWith('name-desc');
  });
});
