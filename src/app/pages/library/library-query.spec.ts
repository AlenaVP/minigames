import { describe, expect, it } from 'vitest';
import { DEFAULT_SORT } from './library.constants';
import { parseLibraryQuery, toLibraryQuery } from './library-query';

describe('parseLibraryQuery', () => {
  it('uses the defaults for an empty query, with no issues', () => {
    expect(parseLibraryQuery(new URLSearchParams())).toEqual({ state: { sort: DEFAULT_SORT, page: 1 }, issues: [] });
  });

  it('reads a valid category, sort and page', () => {
    const { state, issues } = parseLibraryQuery(new URLSearchParams('category=puzzle&sort=name-asc&page=3'));
    expect(state).toEqual({ category: 'puzzle', sort: 'name-asc', page: 3 });
    expect(issues).toEqual([]);
  });

  it('falls back to the default sort and reports an unknown value', () => {
    const { state, issues } = parseLibraryQuery(new URLSearchParams('sort=price'));
    expect(state.sort).toBe(DEFAULT_SORT);
    expect(issues).toEqual(['Unknown sort "price" — sorting by rating.']);
  });

  it.each(['0', '-1', '2.5', 'abc', ''])('rejects page "%s" and shows page 1', (page) => {
    const { state, issues } = parseLibraryQuery(new URLSearchParams({ page }));
    expect(state.page).toBe(1);
    expect(issues).toHaveLength(1);
  });

  it('leaves the category unchecked here (it is validated against the API list later)', () => {
    expect(parseLibraryQuery(new URLSearchParams('category=whatever')).state.category).toBe('whatever');
  });
});

describe('toLibraryQuery', () => {
  it('always writes all three keys for a canonical URL', () => {
    expect(toLibraryQuery({ category: 'puzzle', sort: 'name-desc', page: 2 })).toEqual({
      category: 'puzzle',
      sort: 'name-desc',
      page: '2',
    });
  });

  it('removes the category key while the default category is not known yet', () => {
    expect(toLibraryQuery({ sort: 'rating-desc', page: 1 }).category).toBeNull();
  });

  it('round-trips with parseLibraryQuery', () => {
    const state = { category: 'arcade', sort: 'rating-asc', page: 4 } as const;
    const query = new URLSearchParams(toLibraryQuery(state) as Record<string, string>);
    expect(parseLibraryQuery(query).state).toEqual(state);
  });
});
