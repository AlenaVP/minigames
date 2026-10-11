import type { QueryPatch } from '@app/core/router';
import type { SortValue } from '@shared/types/game';
import { DEFAULT_SORT, SORT_OPTIONS } from './library.constants';
import { INITIAL_LIBRARY_STATE, type LibraryState } from './library-state';

/** Library state ↔ URL: /library?category=puzzle&sort=name-asc&page=2 */
export const LIBRARY_QUERY = { category: 'category', sort: 'sort', page: 'page' } as const;

export interface ParsedLibraryQuery {
  state: LibraryState;
  /** Human-readable problems with the URL — shown as warnings, then the URL is corrected */
  issues: string[];
}

function isSortValue(value: string): value is SortValue {
  return SORT_OPTIONS.some((option) => option.value === value);
}

/**
 * Pure: URL → state. Missing keys mean defaults. Invalid sort/page fall back to defaults with an issue;
 * the category is checked later, against the categories from the API (resolveCategory).
 */
export function parseLibraryQuery(query: URLSearchParams): ParsedLibraryQuery {
  const issues: string[] = [];
  const state: LibraryState = { ...INITIAL_LIBRARY_STATE };

  const category = query.get(LIBRARY_QUERY.category);
  if (category) state.category = category;

  const sort = query.get(LIBRARY_QUERY.sort);
  if (sort !== null) {
    if (isSortValue(sort)) state.sort = sort;
    else issues.push(`Unknown sort "${sort}" — sorting by rating.`);
  }

  const page = query.get(LIBRARY_QUERY.page);
  if (page !== null) {
    if (/^\d+$/.test(page) && Number(page) >= 1) state.page = Number(page);
    else issues.push(`Invalid page "${page}" — showing page 1.`);
  }

  return { state, issues };
}

/** Pure: state → query keys. The canonical URL always carries all three (decided for Story 3). */
export function toLibraryQuery(state: LibraryState): QueryPatch {
  return {
    [LIBRARY_QUERY.category]: state.category ?? null,
    [LIBRARY_QUERY.sort]: state.sort ?? DEFAULT_SORT,
    [LIBRARY_QUERY.page]: String(state.page),
  };
}
