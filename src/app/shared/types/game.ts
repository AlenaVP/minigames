/** GET /api/categories → data[] */
export interface Category {
  /** string, not a union: the list comes from the API and may grow */
  slug: string;
  label: string;
  /** Exactly one category is the default selection */
  isDefault: boolean;
}

export type SortValue = 'rating-asc' | 'rating-desc' | 'name-asc' | 'name-desc';

export interface SortOption {
  value: SortValue;
  /** Visible label, arrows included: "Rating ↓" */
  label: string;
  /** Read by screen readers instead of the label: arrows are announced unreliably */
  srLabel: string;
}

/** GET /api/games → data[] (no `featured` field: the seed JSON has it, the API does not) */
export interface GameSummary {
  slug: string;
  name: string;
  category: string;
  /** Already formatted by the backend: "Free" or "$1.99" */
  price: string;
  shortDescription: string;
  rating: number;
  likesCount: number;
  /** Path inside the frontend's assets — covers are resolved by slug instead (shared/utils/game-cover.ts) */
  cardImage: string;
}

/** Query parameters of GET /api/games (Library mode) */
export interface GamesQuery {
  category: string;
  sort: SortValue;
  page: number;
  limit: number;
}

/** One Library page plus the metadata the pagination is built from */
export interface GamesPage {
  games: readonly GameSummary[];
  page: number;
  totalPages: number;
  totalItems: number;
}
