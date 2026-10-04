import type { Category, SortValue } from '@shared/types/game';
import { DEFAULT_SORT } from './library.constants';

/**
 * What the Library shows — owned by the page, not by the controls (Single Source of Truth).
 * Branch spa-router: parsed from / written to the URL.
 */
export interface LibraryState {
  /** undefined = "the API's default category" (isDefault: true) — known only after GET /categories */
  category?: string;
  sort: SortValue;
  page: number;
}

export const INITIAL_LIBRARY_STATE: LibraryState = { sort: DEFAULT_SORT, page: 1 };

export function isSameLibraryState(a: LibraryState, b: LibraryState): boolean {
  return a.category === b.category && a.sort === b.sort && a.page === b.page;
}

export interface ResolvedCategory {
  slug: string;
  /** true when a requested slug was unknown and the default was used instead */
  isFallback: boolean;
}

/**
 * Validates the requested category BEFORE the games request: an unknown slug would cost a 400
 * from the API (and a rate-limit unit). No request → the default; unknown → the default + isFallback.
 */
export function resolveCategory(requested: string | undefined, categories: readonly Category[]): ResolvedCategory {
  const fallback = categories.find((category) => category.isDefault) ?? categories[0];
  const fallbackSlug = fallback?.slug ?? 'all';

  if (requested === undefined) return { slug: fallbackSlug, isFallback: false };

  const isKnown = categories.some((category) => category.slug === requested);
  return isKnown ? { slug: requested, isFallback: false } : { slug: fallbackSlug, isFallback: true };
}
