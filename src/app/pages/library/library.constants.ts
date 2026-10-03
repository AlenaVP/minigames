import type { Category, SortOption, SortValue } from '@shared/types/game';

// Story 3 (library-api branch): replaced by GET /api/categories
export const CATEGORIES: readonly Category[] = [
  { slug: 'all', label: 'All Games', isDefault: true },
  { slug: 'puzzle', label: 'Puzzle', isDefault: false },
  { slug: 'card', label: 'Card', isDefault: false },
  { slug: 'match', label: 'Match', isDefault: false },
  { slug: 'farm', label: 'Farm', isDefault: false },
  { slug: 'strategy', label: 'Strategy', isDefault: false },
  { slug: 'arcade', label: 'Arcade', isDefault: false },
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
