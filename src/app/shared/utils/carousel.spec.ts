import { describe, expect, it } from 'vitest';
import { getSlotOffsets, getSlotPosition, wrapIndex } from './carousel';

describe('wrapIndex', () => {
  it.each([
    [0, 9, 0],
    [8, 9, 8],
    [9, 9, 0],
    [-1, 9, 8],
    [-10, 9, 8],
    [20, 9, 2],
  ])('wrapIndex(%d, %d) → %d', (index, total, expected) => {
    expect(wrapIndex(index, total)).toBe(expected);
  });
});

describe('getSlotOffsets', () => {
  it('centres an odd number of cards symmetrically', () => {
    expect(getSlotOffsets(9)).toEqual([-4, -3, -2, -1, 0, 1, 2, 3, 4]);
  });

  it('gives the extra card of an even count to the left side', () => {
    expect(getSlotOffsets(8)).toEqual([-4, -3, -2, -1, 0, 1, 2, 3]);
  });
});

describe('getSlotPosition', () => {
  it.each([
    [0, 'center'],
    [1, 'near'],
    [-1, 'near'],
    [2, 'far'],
    [-2, 'far'],
    [3, 'hidden'],
    [-4, 'hidden'],
  ] as const)('offset %d → %s', (offset, expected) => {
    expect(getSlotPosition(offset)).toBe(expected);
  });
});
