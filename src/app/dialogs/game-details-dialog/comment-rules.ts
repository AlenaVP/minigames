import type { AppSession } from '@shared/types/session';

/** POST /games/{slug}/comments: text 1–500 characters after trimming, authorName 2–30 characters */
export const COMMENT_MAX_LENGTH = 500;
const AUTHOR_MIN_LENGTH = 2;
const AUTHOR_MAX_LENGTH = 30;
const FALLBACK_AUTHOR = 'Player';

export type CommentTextCheck = { ok: true; text: string } | { ok: false; reason: 'empty' | 'too-long' };

/** What is sent is the trimmed text; lengths are counted like the server (and maxlength) does, in UTF-16 units */
export function checkCommentText(raw: string): CommentTextCheck {
  const text = raw.trim();
  if (text === '') return { ok: false, reason: 'empty' };
  if (text.length > COMMENT_MAX_LENGTH) return { ok: false, reason: 'too-long' };
  return { ok: true, text };
}

/**
 * authorName within 2–30 (a Google displayName can be anything):
 *   the display name → cut to 30 if longer → the email's local part (same rules) → "Player".
 * Cut on whole characters, so an emoji is never split in half.
 */
export function resolveCommentAuthorName({ displayName, email }: Pick<AppSession, 'displayName' | 'email'>): string {
  for (const candidate of [displayName, email.split('@', 1)[0] ?? '']) {
    const name = cutToLength(candidate.trim(), AUTHOR_MAX_LENGTH).trim();
    if (name.length >= AUTHOR_MIN_LENGTH) return name;
  }
  return FALLBACK_AUTHOR;
}

function cutToLength(text: string, maxLength: number): string {
  let result = '';
  for (const character of text) {
    if (result.length + character.length > maxLength) break;
    result += character;
  }
  return result;
}
