/** How many placeholder colors exist — must match $avatar-palette in comment-item.scss */
export const AVATAR_COLOR_COUNT = 6;

/**
 * Stable color for a user without a photo: the same name always gets the same color,
 * on every open and for every viewer. Chosen by the first letter's code point.
 */
export function getAvatarColorIndex(name: string): number {
  return (name.trim().codePointAt(0) ?? 0) % AVATAR_COLOR_COUNT;
}

export function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}
