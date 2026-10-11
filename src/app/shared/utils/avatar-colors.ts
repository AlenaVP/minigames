/** $color-avatar-random-1 … -5 (Guidebook): the modifier classes are --1 … --5 */
export const AVATAR_COLOR_COUNT = 5;

/**
 * RSS-QS-4-2-3: a random avatar color per commenter, kept while the comments view is mounted —
 * a reloaded list (after a new comment, sign-in, logout) shows the same people in the same colors.
 * Angular analogue: a small stateful service provided at the component level.
 */
export class AvatarColorRegistry {
  private readonly colors = new Map<string, number>();
  private readonly random: () => number;

  /** `random` is injected so tests can control the "dice" */
  constructor(random: () => number = Math.random) {
    this.random = random;
  }

  /** 1 … AVATAR_COLOR_COUNT; the same author (by trimmed name) always gets the same color */
  colorFor(authorName: string): number {
    const key = authorName.trim();
    let color = this.colors.get(key);
    if (color === undefined) {
      color = Math.floor(this.random() * AVATAR_COLOR_COUNT) + 1;
      this.colors.set(key, color);
    }
    return color;
  }
}
