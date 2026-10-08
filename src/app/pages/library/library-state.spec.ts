import { describe, expect, it } from 'vitest';
import { makeCategory } from '@testing/fixtures';
import { INITIAL_LIBRARY_STATE, isSameLibraryState, resolveCategory } from './library-state';

describe('isSameLibraryState', () => {
  it('compares category, sort and page', () => {
    const state = { category: 'puzzle', sort: 'name-asc', page: 2 } as const;
    expect(isSameLibraryState(state, { ...state })).toBe(true);
    expect(isSameLibraryState(state, { ...state, page: 3 })).toBe(false);
    expect(isSameLibraryState(state, { ...state, category: undefined })).toBe(false);
    expect(isSameLibraryState(INITIAL_LIBRARY_STATE, { ...INITIAL_LIBRARY_STATE })).toBe(true);
  });
});

describe('resolveCategory', () => {
  const categories = [
    makeCategory({ slug: 'all', label: 'All', isDefault: true }),
    makeCategory({ slug: 'puzzle', label: 'Puzzle' }),
  ];

  it('uses the API default when nothing was requested', () => {
    expect(resolveCategory(undefined, categories)).toEqual({ slug: 'all', isFallback: false });
  });

  it('keeps a known category', () => {
    expect(resolveCategory('puzzle', categories)).toEqual({ slug: 'puzzle', isFallback: false });
  });

  it('replaces an unknown category with the default and flags it (no 400 request is sent)', () => {
    expect(resolveCategory('racing', categories)).toEqual({ slug: 'all', isFallback: true });
  });

  it('falls back to the first category when none is marked default, and to "all" for an empty list', () => {
    expect(resolveCategory(undefined, [makeCategory({ slug: 'arcade' })])).toEqual({ slug: 'arcade', isFallback: false });
    expect(resolveCategory('puzzle', [])).toEqual({ slug: 'all', isFallback: true });
  });
});
