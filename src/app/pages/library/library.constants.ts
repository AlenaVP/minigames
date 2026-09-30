import type { Category, SortOption, SortValue } from '@shared/types/game';

export const CATEGORIES: readonly Category[] = [
  { slug: 'all', label: 'All Games' },
  { slug: 'puzzle', label: 'Puzzle' },
  { slug: 'card', label: 'Card' },
  { slug: 'match', label: 'Match' },
  { slug: 'farm', label: 'Farm' },
  { slug: 'strategy', label: 'Strategy' },
  { slug: 'arcade', label: 'Arcade' },
];

export const DEFAULT_CATEGORY = 'all';

export const SORT_OPTIONS: readonly SortOption[] = [
  { value: 'rating-asc', label: 'Rating ↑', srLabel: 'Rating, low to high' },
  { value: 'rating-desc', label: 'Rating ↓', srLabel: 'Rating, high to low' },
  { value: 'name-asc', label: 'Name A→Z', srLabel: 'Name, A to Z' },
  { value: 'name-desc', label: 'Name Z→A', srLabel: 'Name, Z to A' },
];

export const DEFAULT_SORT: SortValue = 'rating-desc';

export const LIBRARY_PAGE_SIZE = 6;
