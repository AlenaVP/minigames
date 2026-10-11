import { describe, expect, it } from 'vitest';
import { buildUrl, mergeQuery, parseLocation, sortQuery } from './url';

describe('parseLocation', () => {
  it.each([
    ['/', '/', 'home'],
    ['/home', '/', 'home'],
    ['/library', '/', 'library'],
    ['/library/', '/', 'library'],
    ['/minigames/library', '/minigames/', 'library'],
    ['/minigames/', '/minigames/', 'home'],
    ['/unknown', '/', 'not-found'],
    ['/library/extra', '/', 'not-found'],
  ])('%s (base %s) → %s', (pathname, base, expected) => {
    expect(parseLocation(pathname, '', base).route).toBe(expected);
  });

  it('keeps the query string as URLSearchParams', () => {
    const { query } = parseLocation('/library', '?category=puzzle&page=2', '/');
    expect(query.get('category')).toBe('puzzle');
    expect(query.get('page')).toBe('2');
  });
});

describe('mergeQuery', () => {
  const current = new URLSearchParams('page=2&category=puzzle');

  it('sets, keeps and removes keys: null removes, undefined leaves as is', () => {
    const next = mergeQuery(current, { page: '3', category: undefined, game: 'tiny-glade', missing: null });
    expect(next.toString()).toBe('category=puzzle&page=3&game=tiny-glade');
  });

  it('removes a key with null', () => {
    expect(mergeQuery(current, { page: null }).toString()).toBe('category=puzzle');
  });

  it('does not mutate the original query', () => {
    mergeQuery(current, { page: '9' });
    expect(current.get('page')).toBe('2');
  });
});

describe('sortQuery', () => {
  it('orders known keys canonically and puts unknown keys last, keeping their relative order', () => {
    const sorted = sortQuery(new URLSearchParams('utm=x&auth=login&game=a&page=1&sort=name-asc&category=puzzle&ref=y'));
    expect(sorted.toString()).toBe('category=puzzle&sort=name-asc&page=1&game=a&auth=login&utm=x&ref=y');
  });
});

describe('buildUrl', () => {
  it('uses the canonical path of the route inside the deploy base', () => {
    expect(buildUrl('home', new URLSearchParams(), '/')).toBe('/');
    expect(buildUrl('library', new URLSearchParams('page=2'), '/minigames/')).toBe('/minigames/library?page=2');
  });
});
