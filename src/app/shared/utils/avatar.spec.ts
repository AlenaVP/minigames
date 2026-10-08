import { describe, expect, it } from 'vitest';
import { AVATAR_COLOR_COUNT, getAvatarColorIndex, getInitial, getPlayerInitials } from './avatar';

describe('getInitial', () => {
  it('takes the first character of the trimmed name in upper case', () => {
    expect(getInitial('  alena')).toBe('A');
  });

  it('falls back to "?" for an empty name', () => {
    expect(getInitial(' '.repeat(3))).toBe('?');
  });
});

describe('getPlayerInitials', () => {
  it.each([
    ['Alex_Pro99', 'AP'],
    ['CozyGamer_x', 'CG'],
    ['MatchMaster', 'MM'],
    ['sudoku', 'S'],
    ['Żaneta Łoś', 'ŻŁ'],
    ['42', '4'],
  ])('%s → %s', (name, expected) => {
    expect(getPlayerInitials(name)).toBe(expected);
  });
});

describe('getAvatarColorIndex', () => {
  it('gives the same name the same color every time', () => {
    expect(getAvatarColorIndex('Alena')).toBe(getAvatarColorIndex(' Alena '));
  });

  it('stays inside the palette', () => {
    for (const name of ['A', 'z', 'Ж', '🙂', '']) {
      const index = getAvatarColorIndex(name);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(AVATAR_COLOR_COUNT);
    }
  });
});
