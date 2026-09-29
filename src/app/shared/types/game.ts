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
