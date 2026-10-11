import { describe, expect, it } from 'vitest';
import { getCardCoverUrl, getHeroImageUrl } from './game-cover';

describe('game covers by slug', () => {
  it('finds the bundled card cover and hero image of a known game', () => {
    expect(getCardCoverUrl('tukoni-forest-keepers')).toMatch(/tukoni-forest-keepers-card\.jpg/);
    expect(getHeroImageUrl('tukoni-forest-keepers')).toMatch(/tukoni-forest-keepers-hero\.jpg/);
  });

  it('returns undefined for a game without bundled images', () => {
    expect(getCardCoverUrl('no-such-game')).toBeUndefined();
    expect(getHeroImageUrl('no-such-game')).toBeUndefined();
  });
});
