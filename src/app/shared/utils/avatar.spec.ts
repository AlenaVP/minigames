import { describe, expect, it } from 'vitest';
import {
  AVATAR_COLOR_COUNT,
  getAvatarColorIndex,
  getInitial,
  getPlayerInitials,
  getProfileInitials,
  getUserInitial,
} from './avatar';

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

describe('getProfileInitials', () => {
  it.each([
    ['John Doe', 'JD'],
    ['  alena  ', 'A'],
    ['Mary Ann Smith', 'MA'],
    ['john\u00A0doe', 'JD'],
    ['42 gamer', '4G'],
    ['Żaneta Łoś', 'ŻŁ'],
    ['Алёна Павлова', 'АП'],
    ['山田 太郎', '山太'],
    ['(Bob) Ray', 'BR'],
    ['— John', 'J'],
  ])('%s → %s', (name, expected) => {
    expect(getProfileInitials(name)).toBe(expected);
  });

  it('splits on whitespace only — unlike nickname initials, camelCase and "_" stay one word', () => {
    expect(getProfileInitials('MatchMaster')).toBe('M');
    expect(getProfileInitials('alex_pro')).toBe('A');
  });

  it('returns one code point per word, even for astral letters and letters that uppercase to two', () => {
    expect(getProfileInitials('𝒜da ßeta')).toBe('𝒜S');
  });

  it('composes a letter typed as base + combining accent before taking it', () => {
    expect(getProfileInitials('e\u0301lise')).toBe('É');
  });

  it.each(['', ' '.repeat(3), '🙂', '!!! ???'])('gives "" when there is no letter or digit: %j', (name) => {
    expect(getProfileInitials(name)).toBe('');
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

describe('getUserInitial', () => {
  it.each([
    ['ForestDweller', 'F'],
    ['  alena', 'A'],
    ['żaneta', 'Ż'],
    ['😀Mia', '😀'],
    ['ßeta', 'S'],
    ['', ''],
    [' '.repeat(2), ''],
  ])('%j → %j', (name, expected) => {
    expect(getUserInitial(name)).toBe(expected);
  });
});
