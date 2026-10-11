import type { SortOption, SortValue } from '@shared/types/game';

export const SORT_OPTIONS: readonly SortOption[] = [
  { value: 'rating-asc', label: 'Rating ↑', srLabel: 'Rating, low to high' },
  { value: 'rating-desc', label: 'Rating ↓', srLabel: 'Rating, high to low' },
  { value: 'name-asc', label: 'Name A→Z', srLabel: 'Name, A to Z' },
  { value: 'name-desc', label: 'Name Z→A', srLabel: 'Name, Z to A' },
];

export const DEFAULT_SORT: SortValue = 'rating-desc';

/** 3-2-1: the API is always asked for exactly 6 cards */
export const LIBRARY_PAGE_SIZE = 6;
