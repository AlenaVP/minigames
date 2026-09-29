export interface Category {
  /** string, not a union: in Story 3 the list comes from the API and may grow */
  slug: string;
  label: string;
}

export type SortValue = 'rating-asc' | 'rating-desc' | 'name-asc' | 'name-desc';

export interface SortOption {
  value: SortValue;
  /** Visible label, arrows included: "Rating ↓" */
  label: string;
  /** Read by screen readers instead of the label: arrows are announced unreliably */
  srLabel: string;
}

/** Card-level game data — same shape as tasks/mock-data/all-games-seed.json → data[] */
export interface GameSummary {
  slug: string;
  name: string;
  category: string;
  /** Already formatted by the backend: "Free" or "$1.99" */
  price: string;
  shortDescription: string;
  rating: number;
  likesCount: number;
  cardImage: string;
  featured: boolean;
}
