import { describe, expect, it } from 'vitest';
import { isPageRouteId, toHref } from './routes';

describe('routes', () => {
  it('recognises page route ids only', () => {
    expect(isPageRouteId('home')).toBe(true);
    expect(isPageRouteId('library')).toBe(true);
    expect(isPageRouteId('not-found')).toBe(false);
    expect(isPageRouteId('toString')).toBe(false);
    // "/" has no first path segment
    const segments: string[] = [];
    expect(isPageRouteId(segments[0])).toBe(false);
  });

  it('builds links inside the deploy base', () => {
    const base = import.meta.env.BASE_URL;
    expect(toHref('home')).toBe(base);
    expect(toHref('library')).toBe(`${base}library`);
  });
});
