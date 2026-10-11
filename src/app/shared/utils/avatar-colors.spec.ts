import { describe, expect, it, vi } from 'vitest';
import { AVATAR_COLOR_COUNT, AvatarColorRegistry } from './avatar-colors';

describe('AvatarColorRegistry', () => {
  it('picks the color at random, covering the whole palette 1…5', () => {
    const dice = [0, 0.2, 0.4, 0.6, 0.999];
    const registry = new AvatarColorRegistry(() => dice.shift() ?? 0);

    expect(['A', 'B', 'C', 'D', 'E'].map((name) => registry.colorFor(name))).toEqual([1, 2, 3, 4, 5]);
  });

  it('keeps the color of an author: the dice is rolled once per person', () => {
    const random = vi.fn(() => 0.5);
    const registry = new AvatarColorRegistry(random);

    const first = registry.colorFor('ForestDweller');
    random.mockReturnValue(0);

    expect(registry.colorFor('ForestDweller')).toBe(first);
    expect(registry.colorFor(' ForestDweller ')).toBe(first);
    expect(random).toHaveBeenCalledOnce();
  });

  it('a new registry (the comments view mounted again) rolls again', () => {
    const a = new AvatarColorRegistry(() => 0);
    const b = new AvatarColorRegistry(() => 0.9);

    expect(a.colorFor('Mia')).not.toBe(b.colorFor('Mia'));
  });

  it('uses the real randomness by default and stays inside the palette', () => {
    const color = new AvatarColorRegistry().colorFor('Anyone');

    expect(color).toBeGreaterThanOrEqual(1);
    expect(color).toBeLessThanOrEqual(AVATAR_COLOR_COUNT);
  });
});
