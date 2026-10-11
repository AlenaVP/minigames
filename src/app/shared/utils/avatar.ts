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

const ALPHANUMERIC = /[\p{L}\p{N}]/u;

/**
 * Initials for the signed-in user's avatar (RSS-QS-4-3-1) — unlike getPlayerInitials, words are split on whitespace only:
 * "John Doe" → "JD", "  alena  " → "A", "Mary Ann Smith" → "MA", "42 Gamer" → "4G", "Żaneta Łoś" → "ŻŁ".
 * A word contributes its first letter or digit (any script), so "(Bob) Ray" → "BR".
 * "" means there is nothing to show (empty name, only emoji or punctuation) → the caller draws a generic avatar.
 */
export function getProfileInitials(name: string): string {
  return name
    .normalize('NFC')
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map((word) => {
      const character = ALPHANUMERIC.exec(word)?.[0] ?? '';
      // Code points, not UTF-16 units: "ß" uppercases to "SS", and astral letters (𝒜) are two units long
      return [...character.toUpperCase()][0] ?? '';
    })
    .join('');
}

/**
 * One letter for a comment avatar (RSS-QS-4-2-2: the uppercase first letter of the username):
 * the first non-whitespace character as a whole code point, so "😀Mia" gives "😀", not half of it.
 * "" when the name is blank.
 */
export function getUserInitial(name: string): string {
  const [first = ''] = name.trim();
  return [...first.toUpperCase()][0] ?? '';
}
