import { describe, expect, it } from 'vitest';
import { getVisiblePages } from './pagination';

describe('getVisiblePages', () => {
  it.each([
    // current, total, maxVisible → window
    [1, 4, 3, [1, 2, 3]],
    [2, 4, 3, [1, 2, 3]],
    [3, 4, 3, [2, 3, 4]],
    [4, 4, 3, [2, 3, 4]],
    [6, 10, 4, [5, 6, 7, 8]],
    [10, 10, 4, [7, 8, 9, 10]],
  ])('page %d of %d (max %d) → %j', (current, total, maxVisible, expected) => {
    expect(getVisiblePages(current, total, maxVisible)).toEqual(expected);
  });

  it('shows every page when there are fewer pages than slots', () => {
    expect(getVisiblePages(1, 2, 5)).toEqual([1, 2]);
  });

  it('returns no pages for an empty result or a broken limit', () => {
    expect(getVisiblePages(1, 0, 3)).toEqual([]);
    expect(getVisiblePages(1, 5, 0)).toEqual([]);
  });
});
