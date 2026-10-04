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

/**
 * Two letters from a nickname's first two "words" — split on "_", digits, spaces and camelCase:
 * "Alex_Pro99" → "AP", "CozyGamer_x" → "CG", "MatchMaster" → "MM", "sudoku" → "S".
 */
export function getPlayerInitials(name: string): string {
  const words = name.match(/\p{Lu}?\p{Ll}+|\p{Lu}+(?!\p{Ll})/gu) ?? [];
  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
  return initials || getInitial(name);
}
